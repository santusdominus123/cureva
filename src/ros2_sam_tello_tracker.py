#!/usr/bin/env python3
"""
ROS2 SAM + DJI Tello Object Tracker
Real-time object segmentation and autonomous path planning
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, CompressedImage
from geometry_msgs.msg import Twist, Point, PoseStamped
from std_msgs.msg import Bool, String
from cv_bridge import CvBridge
import cv2
import numpy as np
import torch
from segment_anything import sam_model_registry, SamPredictor
from collections import deque
import threading
import time

class SAMTelloTracker(Node):
    def __init__(self):
        super().__init__('sam_tello_tracker')

        # Parameters
        self.declare_parameter('sam_checkpoint', 'sam_vit_h_4b8939.pth')
        self.declare_parameter('sam_model', 'vit_h')
        self.declare_parameter('target_distance', 1.5)  # meters
        self.declare_parameter('tracking_mode', 'centroid')  # centroid, follow, orbit
        self.declare_parameter('max_speed', 0.3)  # m/s
        self.declare_parameter('pid_kp', 0.5)
        self.declare_parameter('pid_ki', 0.1)
        self.declare_parameter('pid_kd', 0.2)

        # Get parameters
        sam_checkpoint = self.get_parameter('sam_checkpoint').value
        sam_model = self.get_parameter('sam_model').value
        self.target_distance = self.get_parameter('target_distance').value
        self.tracking_mode = self.get_parameter('tracking_mode').value
        self.max_speed = self.get_parameter('max_speed').value

        # PID parameters
        self.kp = self.get_parameter('pid_kp').value
        self.ki = self.get_parameter('pid_ki').value
        self.kd = self.get_parameter('pid_kd').value

        # Initialize SAM
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.get_logger().info(f'Loading SAM model on {self.device}...')
        self.sam = sam_model_registry[sam_model](checkpoint=sam_checkpoint).to(self.device)
        self.predictor = SamPredictor(self.sam)
        self.get_logger().info('SAM model loaded successfully')

        # CV Bridge
        self.bridge = CvBridge()

        # State
        self.target_locked = False
        self.target_bbox = None  # (x1, y1, x2, y2)
        self.target_mask = None
        self.target_centroid = None
        self.current_frame = None
        self.frame_lock = threading.Lock()

        # PID controller state
        self.error_history = deque(maxlen=10)
        self.last_error = np.array([0.0, 0.0, 0.0])  # x, y, z
        self.integral = np.array([0.0, 0.0, 0.0])

        # Tracking history for smoothing
        self.centroid_history = deque(maxlen=5)

        # ROS2 Subscribers
        self.image_sub = self.create_subscription(
            Image,
            '/tello/camera/image_raw',
            self.image_callback,
            10
        )

        self.lock_target_sub = self.create_subscription(
            Point,
            '/sam_tracker/lock_target',
            self.lock_target_callback,
            10
        )

        self.tracking_enable_sub = self.create_subscription(
            Bool,
            '/sam_tracker/enable',
            self.tracking_enable_callback,
            10
        )

        # ROS2 Publishers
        self.cmd_vel_pub = self.create_publisher(
            Twist,
            '/tello/cmd_vel',
            10
        )

        self.mask_pub = self.create_publisher(
            Image,
            '/sam_tracker/mask_image',
            10
        )

        self.debug_pub = self.create_publisher(
            Image,
            '/sam_tracker/debug_image',
            10
        )

        self.centroid_pub = self.create_publisher(
            Point,
            '/sam_tracker/target_centroid',
            10
        )

        self.status_pub = self.create_publisher(
            String,
            '/sam_tracker/status',
            10
        )

        # Timer for control loop
        self.control_timer = self.create_timer(0.05, self.control_loop)  # 20Hz

        self.get_logger().info('SAM Tello Tracker initialized')
        self.publish_status('Waiting for target lock...')

    def publish_status(self, msg: str):
        """Publish status message"""
        status_msg = String()
        status_msg.data = msg
        self.status_pub.publish(status_msg)
        self.get_logger().info(msg)

    def image_callback(self, msg):
        """Receive camera frame from Tello"""
        try:
            with self.frame_lock:
                self.current_frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
        except Exception as e:
            self.get_logger().error(f'Error converting image: {e}')

    def lock_target_callback(self, msg):
        """Lock target at specified point (x, y from normalized 0-1 coordinates)"""
        if self.current_frame is None:
            self.get_logger().warn('No camera frame available')
            return

        with self.frame_lock:
            frame = self.current_frame.copy()

        h, w = frame.shape[:2]
        x = int(msg.x * w)
        y = int(msg.y * h)

        self.get_logger().info(f'Locking target at ({x}, {y})')
        self.publish_status(f'Locking target at ({x}, {y})...')

        # Run SAM with point prompt
        self.predictor.set_image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        point_coords = np.array([[x, y]])
        point_labels = np.array([1])  # positive point

        with torch.inference_mode():
            masks, scores, _ = self.predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                multimask_output=True
            )

        # Get best mask
        best_idx = np.argmax(scores)
        self.target_mask = masks[best_idx].astype(np.uint8)

        # Calculate bounding box from mask
        contours, _ = cv2.findContours(self.target_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            x1, y1, bw, bh = cv2.boundingRect(largest_contour)
            self.target_bbox = (x1, y1, x1 + bw, y1 + bh)

            # Calculate centroid
            M = cv2.moments(largest_contour)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                self.target_centroid = (cx, cy)
                self.centroid_history.clear()
                self.centroid_history.append(self.target_centroid)

        self.target_locked = True
        self.publish_status(f'Target locked! Score: {scores[best_idx]:.3f}')

        # Publish mask visualization
        self.publish_mask_visualization(frame, self.target_mask)

    def tracking_enable_callback(self, msg):
        """Enable/disable autonomous tracking"""
        if msg.data and not self.target_locked:
            self.get_logger().warn('Cannot enable tracking: no target locked')
            self.publish_status('Error: No target locked')
            return

        if not msg.data:
            # Stop drone
            self.publish_cmd_vel(0, 0, 0, 0)
            self.publish_status('Tracking disabled')
        else:
            self.publish_status('Autonomous tracking enabled')

        self.target_locked = msg.data

    @torch.inference_mode()
    def update_tracking(self):
        """Update target mask using previous mask as prompt"""
        if self.current_frame is None or self.target_bbox is None:
            return False

        with self.frame_lock:
            frame = self.current_frame.copy()

        # Use bounding box from previous detection
        x1, y1, x2, y2 = self.target_bbox
        box_prompt = np.array([[x1, y1, x2, y2]], dtype=np.float32)

        # Set image and predict
        self.predictor.set_image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        masks, scores, _ = self.predictor.predict(
            box=box_prompt,
            multimask_output=False
        )

        mask = masks[0].astype(np.uint8)

        # Update if mask is valid
        if mask.sum() > 100:  # minimum pixels
            self.target_mask = mask

            # Update bounding box and centroid
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                largest_contour = max(contours, key=cv2.contourArea)
                x1, y1, bw, bh = cv2.boundingRect(largest_contour)
                self.target_bbox = (x1, y1, x1 + bw, y1 + bh)

                # Calculate centroid
                M = cv2.moments(largest_contour)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])
                    self.target_centroid = (cx, cy)
                    self.centroid_history.append(self.target_centroid)

            return True
        else:
            self.get_logger().warn('Lost target!')
            self.publish_status('Warning: Target lost')
            return False

    def get_smoothed_centroid(self):
        """Get smoothed centroid from history"""
        if not self.centroid_history:
            return None
        centroids = np.array(self.centroid_history)
        return np.mean(centroids, axis=0).astype(int)

    def compute_control_command(self):
        """Compute drone control command using PID controller"""
        if self.current_frame is None or self.target_centroid is None:
            return None

        h, w = self.current_frame.shape[:2]
        frame_center = np.array([w / 2, h / 2])

        # Get smoothed centroid
        centroid = self.get_smoothed_centroid()
        if centroid is None:
            return None

        # Calculate error (normalized -1 to 1)
        error_x = (centroid[0] - frame_center[0]) / (w / 2)  # left-right
        error_y = (centroid[1] - frame_center[1]) / (h / 2)  # up-down

        # Estimate distance error based on bbox size
        if self.target_bbox:
            x1, y1, x2, y2 = self.target_bbox
            bbox_height = y2 - y1
            # Assume target should occupy ~30% of frame height at target distance
            target_height = h * 0.3
            error_z = (bbox_height - target_height) / target_height
        else:
            error_z = 0.0

        error = np.array([error_x, error_y, error_z])

        # PID calculation
        self.integral += error
        self.integral = np.clip(self.integral, -10, 10)  # anti-windup

        derivative = error - self.last_error
        self.last_error = error

        control = self.kp * error + self.ki * self.integral + self.kd * derivative

        # Map to drone commands
        # Tello coordinate system: x=forward, y=left, z=up
        cmd_x = -control[2]  # forward/backward based on distance
        cmd_y = -control[0]  # left/right based on horizontal error
        cmd_z = -control[1]  # up/down based on vertical error
        cmd_yaw = control[0] * 0.5  # yaw to keep target centered

        # Limit speeds
        cmd_x = np.clip(cmd_x, -self.max_speed, self.max_speed)
        cmd_y = np.clip(cmd_y, -self.max_speed, self.max_speed)
        cmd_z = np.clip(cmd_z, -self.max_speed, self.max_speed)
        cmd_yaw = np.clip(cmd_yaw, -0.5, 0.5)

        return (cmd_x, cmd_y, cmd_z, cmd_yaw)

    def publish_cmd_vel(self, x, y, z, yaw):
        """Publish velocity command to Tello"""
        msg = Twist()
        msg.linear.x = float(x)
        msg.linear.y = float(y)
        msg.linear.z = float(z)
        msg.angular.z = float(yaw)
        self.cmd_vel_pub.publish(msg)

    def publish_mask_visualization(self, frame, mask):
        """Publish mask overlay for visualization"""
        vis = frame.copy()

        # Overlay mask
        color_mask = np.zeros_like(vis)
        color_mask[mask > 0] = [0, 255, 0]
        vis = cv2.addWeighted(vis, 0.7, color_mask, 0.3, 0)

        # Draw bounding box
        if self.target_bbox:
            x1, y1, x2, y2 = self.target_bbox
            cv2.rectangle(vis, (x1, y1), (x2, y2), (255, 0, 0), 2)

        # Draw centroid
        if self.target_centroid:
            cv2.circle(vis, self.target_centroid, 5, (0, 0, 255), -1)
            cv2.drawMarker(vis, self.target_centroid, (0, 255, 255),
                          cv2.MARKER_CROSS, 20, 2)

        # Draw frame center
        h, w = frame.shape[:2]
        cv2.circle(vis, (w//2, h//2), 3, (255, 255, 0), -1)

        # Publish
        try:
            mask_msg = self.bridge.cv2_to_imgmsg(vis, encoding='bgr8')
            self.debug_pub.publish(mask_msg)
        except Exception as e:
            self.get_logger().error(f'Error publishing mask: {e}')

    def control_loop(self):
        """Main control loop (20Hz)"""
        if not self.target_locked or self.current_frame is None:
            return

        # Update tracking
        success = self.update_tracking()

        if success:
            # Compute control command
            cmd = self.compute_control_command()

            if cmd:
                x, y, z, yaw = cmd
                self.publish_cmd_vel(x, y, z, yaw)

                # Publish centroid
                if self.target_centroid:
                    centroid_msg = Point()
                    centroid_msg.x = float(self.target_centroid[0])
                    centroid_msg.y = float(self.target_centroid[1])
                    centroid_msg.z = 0.0
                    self.centroid_pub.publish(centroid_msg)

            # Publish visualization
            with self.frame_lock:
                if self.current_frame is not None:
                    self.publish_mask_visualization(self.current_frame, self.target_mask)
        else:
            # Lost target - stop
            self.publish_cmd_vel(0, 0, 0, 0)
            self.target_locked = False
            self.publish_status('Target lost - tracking stopped')

def main(args=None):
    rclpy.init(args=args)
    node = SAMTelloTracker()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
