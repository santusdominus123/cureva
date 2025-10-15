import os, glob, sys, argparse, textwrap
import numpy as np, cv2
from pathlib import Path
from typing import List, Tuple, Optional

import torch
from segment_anything import sam_model_registry, SamPredictor

# ---------------------- Utilities ----------------------

def list_images(path_like: str) -> List[str]:
    p = Path(path_like)
    if p.is_file():
        return [str(p)]
    exts = ("*.jpg","*.jpeg","*.png","*.bmp","*.tif","*.tiff")
    files = []
    for e in exts:
        files += sorted([str(x) for x in Path(path_like).glob(e)])
    return files

def rgba_with_mask(bgr: np.ndarray, mask: np.ndarray, alpha: int=255) -> np.ndarray:
    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
    rgba[...,3] = (mask.astype(np.uint8) * alpha)
    return rgba

def overlay_mask(bgr: np.ndarray, mask: np.ndarray, alpha: float=0.45) -> np.ndarray:
    if mask.dtype != np.uint8:
        mask = mask.astype(np.uint8)
    color = np.array([0, 255, 0], dtype=np.uint8)  # green overlay
    overlay = bgr.copy()
    overlay[mask > 0] = (overlay[mask > 0] * (1 - alpha) + color * alpha).astype(np.uint8)
    return overlay

def draw_guides(img: np.ndarray, pos_pts: List[Tuple[int,int]], neg_pts: List[Tuple[int,int]],
                box: Optional[Tuple[int,int,int,int]], show_box: bool, scale: float) -> None:
    # draw points
    for (x,y) in pos_pts:
        cv2.drawMarker(img, (int(x*scale), int(y*scale)), (40,240,40), cv2.MARKER_TILTED_CROSS, 16, 2)
    for (x,y) in neg_pts:
        cv2.drawMarker(img, (int(x*scale), int(y*scale)), (30,30,230), cv2.MARKER_TILTED_CROSS, 16, 2)
    # draw box
    if show_box and box is not None:
        x1,y1,x2,y2 = box
        cv2.rectangle(img, (int(x1*scale), int(y1*scale)), (int(x2*scale), int(y2*scale)), (255,180,0), 2)

def put_status(img: np.ndarray, text: str, line: int=0):
    y = 24 + 26*line
    cv2.rectangle(img, (5, y-20), (5+len(text)*9, y+6), (0,0,0), -1)
    cv2.putText(img, text, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1, cv2.LINE_AA)

HELP_TEXT = """
Left click: +point (object)    Right click: -point (background)
b: toggle Box mode (drag with left mouse)     r: reset selections
m: run SAM on current points/box              s: save mask & cutout
n / p: next / previous image                  h: show/hide help
q or ESC: quit
"""

# ---------------------- App ----------------------

class SAMGui:
    def __init__(self, img_paths: List[str], out_dir: str, sam_checkpoint: str, sam_model: str,
                 max_display_size: int = 1280, device: Optional[str] = None):
        assert len(img_paths) > 0, "No images to show."
        self.img_paths = img_paths
        self.idx = 0
        self.out_dir = Path(out_dir); self.out_dir.mkdir(parents=True, exist_ok=True)

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.sam = sam_model_registry[sam_model](checkpoint=sam_checkpoint).to(self.device)
        self.predictor = SamPredictor(self.sam)

        self.max_display_size = max_display_size

        # per-image state
        self.pos_pts: List[Tuple[int,int]] = []
        self.neg_pts: List[Tuple[int,int]] = []
        self.box: Optional[Tuple[int,int,int,int]] = None  # xyxy in ORIGINAL coordinates
        self.dragging = False
        self.box_mode = False
        self.mask: Optional[np.ndarray] = None  # (H,W) binary
        self.help = True

        # image buffers
        self.orig_bgr = None
        self.disp = None
        self.scale = 1.0  # display = original * scale
        self.win = "SAM GUI"

        self.load_current()

        cv2.namedWindow(self.win, cv2.WINDOW_NORMAL | cv2.WINDOW_GUI_EXPANDED)
        cv2.setMouseCallback(self.win, self.on_mouse)

    # ------------ image IO ------------
    def load_current(self):
        path = self.img_paths[self.idx]
        self.orig_bgr = cv2.imread(path, cv2.IMREAD_COLOR)
        if self.orig_bgr is None:
            raise RuntimeError(f"Failed to read {path}")
        h, w = self.orig_bgr.shape[:2]
        s = min(self.max_display_size / max(h, w), 1.0)
        self.scale = s
        self.disp = cv2.resize(self.orig_bgr, (int(w*s), int(h*s)), interpolation=cv2.INTER_AREA)
        # set image in predictor (RGB)
        self.predictor.set_image(cv2.cvtColor(self.orig_bgr, cv2.COLOR_BGR2RGB))
        # reset state
        self.pos_pts, self.neg_pts, self.box, self.mask = [], [], None, None
        print(f"\nLoaded [{self.idx+1}/{len(self.img_paths)}]: {path} (orig {w}x{h}, scale {s:.3f})")

    # ------------ mouse ------------
    def on_mouse(self, event, x, y, flags, param):
        ox, oy = int(x / self.scale), int(y / self.scale)  # back to original coords

        if event == cv2.EVENT_LBUTTONDOWN:
            if self.box_mode:
                self.dragging = True
                self.box = (ox, oy, ox, oy)
            else:
                self.pos_pts.append((ox, oy))
                self.mask = None  # clear previous mask to avoid confusion
        elif event == cv2.EVENT_MOUSEMOVE and self.dragging and self.box_mode:
            x1, y1, _, _ = self.box if self.box else (ox, oy, ox, oy)
            self.box = (x1, y1, ox, oy)
        elif event == cv2.EVENT_LBUTTONUP and self.dragging and self.box_mode:
            self.dragging = False
            x1, y1, x2, y2 = self.box
            # normalize box
            x1, x2 = sorted([x1, x2]); y1, y2 = sorted([y1, y2])
            self.box = (max(0,x1), max(0,y1), min(self.orig_bgr.shape[1]-1,x2), min(self.orig_bgr.shape[0]-1,y2))
            self.mask = None
        elif event == cv2.EVENT_RBUTTONDOWN:
            if not self.box_mode:
                self.neg_pts.append((ox, oy))
                self.mask = None

    # ------------ SAM predict ------------
    @torch.inference_mode()
    def run_sam(self):
        if len(self.pos_pts) == 0 and self.box is None:
            print("Add at least one positive point or draw a box (press 'b').")
            return
        pts = np.array(self.pos_pts + self.neg_pts)
        if pts.shape[0] == 0:
            pts = None
            labels = None
        else:
            labels = np.array([1]*len(self.pos_pts) + [0]*len(self.neg_pts))

        box_np = None
        if self.box is not None:
            x1,y1,x2,y2 = self.box
            # SAM requires float32 xyxy
            box_np = np.array([[x1,y1,x2,y2]], dtype=np.float32)

        masks, scores, _ = self.predictor.predict(
            point_coords=pts if pts is not None else None,
            point_labels=labels if pts is not None else None,
            box=box_np,
            multimask_output=True
        )
        best = int(np.argmax(scores))
        m = masks[best].astype(np.uint8)  # HxW in original size
        self.mask = m
        print(f"SAM mask updated (score={scores[best]:.3f})")

    # ------------ Save ------------
    def save(self):
        if self.mask is None or self.mask.sum() == 0:
            print("No mask to save.")
            return
        path = Path(self.img_paths[self.idx])
        stem = path.stem
        mask_path = self.out_dir / f"{stem}_mask.png"
        cut_png = self.out_dir / f"{stem}_cut.png"
        cut_jpg = self.out_dir / f"{stem}_cut.jpg"

        # --- Corrected part ---
        # Convert BGR -> RGB before adding alpha
        # rgb = cv2.cvtColor(self.orig_bgr, cv2.COLOR_BGR2RGB)
        rgba = cv2.cvtColor(self.orig_bgr, cv2.COLOR_RGB2RGBA)
        rgba[..., 3] = (self.mask.astype(np.uint8) * 255)
        cv2.imwrite(str(cut_png), rgba)

        # Cutout with black background (still in BGR for jpg)
        cut = self.orig_bgr.copy()
        cut[self.mask == 0] = 0
        cv2.imwrite(str(cut_jpg), cut)
        # ----------------------
        print(f"Saved:\n  {mask_path}\n  {cut_png}\n  {cut_jpg}")

    # ------------ Drawing / loop ------------
    def redraw(self):
        vis = self.disp.copy()
        if self.mask is not None:
            # resize mask to disp size for preview
            m_small = cv2.resize(self.mask, (vis.shape[1], vis.shape[0]), interpolation=cv2.INTER_NEAREST)
            vis = overlay_mask(vis, m_small, alpha=0.45)

        draw_guides(vis, self.pos_pts, self.neg_pts, self.box, True, self.scale)

        put_status(vis, f"[{self.idx+1}/{len(self.img_paths)}]  "
                        f"+pts:{len(self.pos_pts)}  -pts:{len(self.neg_pts)}  "
                        f"box:{'Y' if self.box else 'N'}  mode:{'BOX' if self.box_mode else 'POINT'}", 0)
        if self.help:
            lines = textwrap.dedent(HELP_TEXT).strip().splitlines()
            for i, ln in enumerate(lines, start=1):
                put_status(vis, ln, i)
        cv2.imshow(self.win, vis)

    def next_img(self, delta: int):
        self.idx = (self.idx + delta) % len(self.img_paths)
        self.load_current()

    def toggle_mode(self):
        self.box_mode = not self.box_mode
        print(f"Mode: {'BOX' if self.box_mode else 'POINT'}")

    def reset(self):
        self.pos_pts.clear(); self.neg_pts.clear(); self.box=None; self.mask=None

    def loop(self):
        print(HELP_TEXT)
        while True:
            self.redraw()
            k = cv2.waitKey(30) & 0xFFFF
            if k in (ord('q'), 27):     # q or ESC
                break
            elif k == ord('h'):
                self.help = not self.help
            elif k == ord('b'):
                self.toggle_mode()
            elif k == ord('r'):
                self.reset()
            elif k == ord('m'):
                self.run_sam()
            elif k == ord('s'):
                self.save()
            elif k == ord('n') or k == 83:  # right arrow
                self.next_img(+1)
            elif k == ord('p') or k == 81:  # left arrow
                self.next_img(-1)
        cv2.destroyAllWindows()

# ---------------------- Main ----------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", required=True, help="Folder with images or a single image file")
    ap.add_argument("--out", default="sam_out", help="Folder to save masks and cut-outs")
    ap.add_argument("--sam-checkpoint", required=True, help="Path to SAM .pth checkpoint")
    ap.add_argument("--sam-model", default="vit_h", choices=["vit_h","vit_l","vit_b"])
    ap.add_argument("--max-display", type=int, default=1280, help="Max height/width for the on-screen preview")
    args = ap.parse_args()

    imgs = list_images(args.images)
    if not imgs:
        print("No images found.", file=sys.stderr)
        sys.exit(1)

    app = SAMGui(imgs, args.out, args.sam_checkpoint, args.sam_model, args.max_display)
    app.loop()

if __name__ == "__main__":
    main()
