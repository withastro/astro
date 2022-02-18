import { parse, isBefore } from 'date-fns';

export async function getAllPosts() {
  const files = await import.meta.glob("./**/*.md");
  const posts = (
    await Promise.all(
      Object.values(files).map((importFile: any, index) =>
        importFile().then((res) => {
          const { title, description, authors, publishDate, socialImage } = res.frontmatter;
          const href = Object.keys(files)
            [index].replace(/^\./, "/blog")
                .replace(/\.md$/, "");

          return {
            title,
            description,
            authors,
            publishDate: parse(publishDate, "MMMM d, yyyy", new Date()),
            socialImage,
            href,
            Content: res.default
          };
        })
      )
    )
  ).sort((a, b) => {
    if (isBefore(a.publishDate, b.publishDate)) return 1;
    if (isBefore(b.publishDate, a.publishDate)) return -1;
    return 0;
  });
  return posts;
}
