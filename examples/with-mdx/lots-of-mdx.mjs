import fs from "fs";
import path from "path";

const NUM_POSTS = 10;
const POSTS_DIR = "./src/pages/posts.generated";

(async function writePosts() {
  const numPosts = Number(process.argv[2]) ?? NUM_POSTS;
  if (fs.existsSync(POSTS_DIR)) {
    const files = await fs.promises.readdir(POSTS_DIR);
    await Promise.all(
      files.map((file) => fs.promises.unlink(path.join(POSTS_DIR, file)))
    );
  } else {
    await fs.promises.mkdir(POSTS_DIR);
  }

  await Promise.all(
    Array.from(Array(numPosts).keys()).map((idx) => {
      return fs.promises.writeFile(
        `${POSTS_DIR}/post-${idx}.mdx`,
        toMdContents(idx)
      );
    })
  );

  console.log(`${numPosts} posts written 🚀`);
})();

const raw = fs.readFileSync('./example-mdx.mdx', 'utf-8');

const toMdContents = (idx) => raw;
