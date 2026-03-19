import { hash } from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run hash-password <password>");
  process.exit(1);
}

hash(password, 10).then((hashed) => {
  console.log("\nGenerated hash (set as ADMIN_PASSWORD_HASH in .env.local):\n");
  console.log(hashed);
});
