# =============================================================
#  DIP Platform — Python Helper (auto-injected before student code)
# =============================================================
import os, sys, json
import numpy as np
import cv2
from PIL import Image

# Matplotlib: use non-interactive backend
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# --- Platform variables ---
INPUT_IMAGE = os.environ.get('INPUT_IMAGE', 'input.png')
WORK_DIR = os.environ.get('WORK_DIR', '.')
os.chdir(WORK_DIR)

# --- Helper functions ---
def imread_gray(path=None):
    """Read input image as grayscale."""
    p = path or INPUT_IMAGE
    return cv2.imread(p, cv2.IMREAD_GRAYSCALE)

def imread_color(path=None):
    """Read input image as BGR color."""
    p = path or INPUT_IMAGE
    return cv2.imread(p, cv2.IMREAD_COLOR)

def imread_rgb(path=None):
    """Read input image as RGB color."""
    p = path or INPUT_IMAGE
    img = cv2.imread(p, cv2.IMREAD_COLOR)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB) if img is not None else None

def savefig(fig_or_path, name='result'):
    """Save a matplotlib figure or image array as result."""
    if isinstance(fig_or_path, str):
        # It's a path, just copy
        pass
    elif hasattr(fig_or_path, 'savefig'):
        # It's a matplotlib figure
        fig_or_path.savefig(name + '.png', dpi=100, bbox_inches='tight')
        plt.close(fig_or_path)
    elif isinstance(fig_or_path, np.ndarray):
        # It's an image array
        if fig_or_path.dtype != np.uint8:
            fig_or_path = np.clip(fig_or_path, 0, 255).astype(np.uint8)
        cv2.imwrite(name + '.png', fig_or_path)

def show_hist(gray, title='Histogram'):
    """Quick histogram plot saved as result."""
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.hist(gray.ravel(), bins=256, range=[0, 256], color='#6366f1', alpha=0.8)
    ax.set_title(title)
    ax.set_xlabel('Pixel Value')
    ax.set_ylabel('Count')
    fig.savefig('result.png', dpi=100, bbox_inches='tight')
    plt.close(fig)

def info(**kwargs):
    """Print structured info."""
    for k, v in kwargs.items():
        if isinstance(v, np.ndarray):
            print(f'{k}: shape={v.shape}, dtype={v.dtype}, range=[{v.min()}, {v.max()}]')
        else:
            print(f'{k}: {v}')
