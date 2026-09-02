import { hashPassword } from "../src/lib/kitchen-password";

const password = process.argv[2];
if (!password) {
  console.error(
    "Usage: npx tsx scripts/generate-kitchen-password-hash.ts <password>",
  );
  process.exit(1);
}

console.log(hashPassword(password));
