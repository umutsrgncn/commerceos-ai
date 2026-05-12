"use server";

import { revalidatePath } from "next/cache";
import { toggleWishlist } from "./wishlist";

export async function toggleWishlistAction(productId: string) {
  const r = await toggleWishlist(productId);
  if (r.ok) {
    revalidatePath("/shop/account/wishlist");
  }
  return r;
}
