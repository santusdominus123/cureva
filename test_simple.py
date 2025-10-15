#!/usr/bin/env python3
"""
Simple test to check if Python GUI works
"""

import tkinter as tk
from tkinter import messagebox

def test_gui():
    root = tk.Tk()
    root.title("Test GUI")
    root.geometry("400x300")
    root.configure(bg='#2c3e50')

    label = tk.Label(root, text="GUI Test berhasil!",
                    font=('Arial', 16, 'bold'),
                    fg='white', bg='#2c3e50')
    label.pack(pady=50)

    button = tk.Button(root, text="Close",
                      command=root.destroy,
                      font=('Arial', 12),
                      bg='#e74c3c', fg='white',
                      padx=20, pady=10)
    button.pack(pady=20)

    print("GUI window created successfully!")
    messagebox.showinfo("Success", "Python GUI works!")

    root.mainloop()

if __name__ == "__main__":
    print("Starting simple GUI test...")
    test_gui()
    print("GUI test completed!")