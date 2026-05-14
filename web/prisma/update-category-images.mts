/**
 * Kategori banner görsellerini Higgsfield CloudFront URL'leriyle eşle ve
 * production DB'ye yaz.
 *
 *   pnpm tsx --env-file=.env.local prisma/update-category-images.mts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const IMAGES: Record<string, string> = {
  tisort:
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050811_8e807077-034d-4450-8ee3-4adefcf655ce.png",
  gomlek:
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050823_10f028d6-1fb1-47f0-9f19-e1fabea8b76a.png",
  "sweat-kazak":
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050833_249cdb7d-2324-4ffa-8b51-48832d7ab0f7.png",
  pantolon:
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050846_0b4d1a63-d268-4231-b276-99c4ce09d341.png",
  elbise:
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050856_28897abe-89af-48ef-88bf-0ed75da5f501.png",
  etek:
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050910_181d9d78-4bba-448a-8b68-2f1144505439.png",
  aksesuar:
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050935_803982e6-559c-450c-8b93-b2684796589d.png",
  canta:
    "https://d8j0ntlcm91z4.cloudfront.net/user_3DXrMIclPfE65ZKXNgkAjSjp7Gr/hf_20260514_050946_44742554-9184-445c-8c65-5d2a50d02aed.png",
};

async function main() {
  for (const [slug, url] of Object.entries(IMAGES)) {
    const r = await db.category.update({
      where: { slug },
      data: { imageUrl: url },
      select: { name: true },
    });
    console.log(`✓ ${slug.padEnd(14)} → ${r.name}`);
  }
  console.log("\n✅ Tamam.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
