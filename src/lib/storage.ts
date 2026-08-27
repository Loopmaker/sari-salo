const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PRODUCT_IMAGES_BUCKET = "product-images";

export function getProductImageUrl(imagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${imagePath}`;
}
