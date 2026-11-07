import os, glob
from PIL import Image
from rembg import remove
import numpy as np
import scipy.ndimage

IMAGES_DIR = "public/images"

def find_file(pattern):
    matches = glob.glob(os.path.join(IMAGES_DIR, pattern))
    if not matches:
        raise FileNotFoundError(f"No match for pattern: {pattern}")
    return matches[0]

def make_square_jpg(src_path, dst_path, size=1024):
    im = Image.open(src_path).convert("RGB")
    # center crop to 1:1
    w, h = im.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    cropped = im.crop((left, top, left + min_dim, top + min_dim))
    resized = cropped.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(dst_path, "JPEG", quality=92)
    print(f"Saved JPG: {dst_path}")

def make_cutout_png(src_path, dst_path, canvas_size=1024, target_size=800, alpha_thresh=60):
    im = Image.open(src_path)
    out = remove(im)
    arr = np.array(out)
    alpha = arr[:, :, 3]

    labeled, num_features = scipy.ndimage.label(alpha > alpha_thresh)
    if num_features > 0:
        sizes = scipy.ndimage.sum(alpha > alpha_thresh, labeled, range(1, num_features + 1))
        largest_label = int(np.argmax(sizes) + 1)
        main_mask = (labeled == largest_label)
        dilated_mask = scipy.ndimage.binary_dilation(main_mask, iterations=4)

        clean_arr = arr.copy()
        clean_arr[~dilated_mask] = 0
        clean_arr[alpha < 15] = 0

        ys, xs = np.where(dilated_mask)
        ymin, ymax = max(0, int(ys.min()) - 2), min(out.height, int(ys.max()) + 2)
        xmin, xmax = max(0, int(xs.min()) - 2), min(out.width, int(xs.max()) + 2)

        clean_im = Image.fromarray(clean_arr)
        cropped = clean_im.crop((xmin, ymin, xmax, ymax))
        w, h = cropped.size
        scale = target_size / max(w, h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        paste_x = (canvas_size - new_w) // 2
        paste_y = (canvas_size - new_h) // 2
        canvas.paste(resized, (paste_x, paste_y), resized)
        canvas.save(dst_path, "PNG")
        print(f"Saved Cutout PNG: {dst_path} ({new_w}x{new_h})")
    else:
        out.save(dst_path, "PNG")
        print(f"Saved fallback PNG (no mask): {dst_path}")

mappings = [
    # Cookies
    ("jpg", "Cocoa_cookie_oozing_Nutella_5253805b*", "nutella-cookie.jpg"),
    ("cutout", "Chocolate_cookie_oozing_Nutella*4d7858fe*", "nutella-cookie-cutout.png"),
    ("jpg", "Reindeer_cookies_on_ceramic_plate_3c5406b8*", "maltesers-reindeer.jpg"),
    ("cutout", "Chocolate_cookie_decorated_as_re*f32f5146*", "maltesers-reindeer-cutout.png"),
    ("jpg", "Chocolate_orange_cookie_broken_i*9efa6cfd*", "chocolate-orange.jpg"),
    ("cutout", "Chocolate_orange_cookie_on_white_2eb30567*", "chocolate-orange-cutout.png"),

    # Cupcakes
    ("jpg", "Cupcakes_with_strawberry_frostin*2afe7838*", "vanilla-strawberry.jpg"),
    ("cutout", "Strawberry_cupcake_with_buttercr*42154a21*", "vanilla-strawberry-cutout.png"),
    ("jpg", "Bakery_box_with_salted_caramel_3becf796*", "salted-caramel-cupcake.jpg"),
    ("cutout", "Caramel_cupcake_with_sea_salt_1bc6f288*", "salted-caramel-cupcake-cutout.png"),
    ("jpg", "Double_chocolate_fudge_cupcake_22ae571f*", "double-chocolate-cupcake.jpg"),
    ("cutout", "Chocolate_cupcake_with_ganache_s*83a07264*", "double-chocolate-cupcake-cutout.png"),
    ("jpg", "Red_velvet_cupcake_on_saucer_e97d66d0*", "red-velvet-cupcake.jpg"),
    ("cutout", "Red_velvet_cupcake_with_frosting_f0e708f0*", "red-velvet-cupcake-cutout.png"),
    ("jpg", "Lemon_elderflower_cupcakes_on_ta*93d935fb*", "lemon-elderflower-cupcake.jpg"),
    ("cutout", "Lemon_sponge_cupcake_with_butter*f070d650*", "lemon-elderflower-cupcake-cutout.png"),
    ("jpg", "Gingerbread_cupcakes_on_wooden_b*fa1cc749*", "gingerbread-cupcake.jpg"),
    ("cutout", "Spiced_molasses_cupcake_with_fro*98285d7d*", "gingerbread-cupcake-cutout.png"),
    ("jpg", "Cocoa_cupcake_with_buttercream_s*9cc0092b*", "mint-hot-chocolate-cupcake.jpg"),
    ("cutout", "Cocoa_cupcake_with_buttercream_s*9cc0092b*", "mint-hot-chocolate-cupcake-cutout.png"),

    # Cakes
    ("jpg", "Victoria_sponge_cake_displayed_95ccb0fa*", "victoria-sponge.jpg"),
    ("cutout", "Victoria_sponge_cake_with_jam_d77ac769*", "victoria-sponge-cutout.png"),
    ("jpg", "Chocolate_celebration_cake_with_*4f58c0a7*", "chocolate-fudge-cake.jpg"),
    ("cutout", "Chocolate_celebration_cake_with_*4f58c0a7*", "chocolate-fudge-cake-cutout.png"),
    ("jpg", "Lemon_raspberry_layer_cake_84fb84e3*", "lemon-raspberry-cake.jpg"),
    ("cutout", "Lemon_raspberry_layer_cake_84fb84e3*", "lemon-raspberry-cake-cutout.png"),
    ("jpg", "Pistachio_rose_cake_on_countertop_a1def5f1*", "pistachio-rose-cake.jpg"),
    ("cutout", "Pistachio_rose_cake_on_countertop_a1def5f1*", "pistachio-rose-cake-cutout.png"),
    ("jpg", "Miniature_bento_cake_in_box_5d04d71b*", "bento-cake.jpg"),
    ("cutout", "Bento_box_cake_with_message_78a9b215*", "bento-cake-cutout.png"),
    ("jpg", "Spiced_orange_winter_cake_8aa7b2f2*", "spiced-orange-cake.jpg"),
    ("cutout", "Spiced_orange_winter_cake_8aa7b2f2*", "spiced-orange-cake-cutout.png"),

    # Favours
    ("jpg", "Decorated_sugar_cookie_wedding_f*dde7b186*", "favour-bags.jpg"),
    ("cutout", "Wedding_favor_sugar_cookie_3976514b*", "favour-cutout.png"),
]

for kind, pattern, out_name in mappings:
    src = find_file(pattern)
    dst = os.path.join(IMAGES_DIR, out_name)
    if kind == "jpg":
        make_square_jpg(src, dst)
    else:
        make_cutout_png(src, dst)

# Create thumbnail for cupcake
im_cupcake = Image.open(os.path.join(IMAGES_DIR, "vanilla-strawberry-cutout.png"))
thumb = im_cupcake.resize((200, 200), Image.Resampling.LANCZOS)
thumb.save(os.path.join(IMAGES_DIR, "thumb-cupcake.png"), "PNG")
print("Saved thumb-cupcake.png")
