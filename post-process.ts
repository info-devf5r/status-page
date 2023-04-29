import { readFile, writeFile, copyFile, copy, remove, pathExists } from "fs-extra";
import { load } from "js-yaml";
import { join } from "path";
import { execSync } from "child_process";

export const postProcess = async () => {
  let config: {
    "status-website"?: {
      cname?: string;
      robotsText?: string;
      baseUrl?: string;
    };
  } = load(await readFile(join("..", ".upptimerc.yml"), "utf8")) as any;
  const baseUrl = (config["status-website"] || {}).baseUrl || "/";

  execSync(`sapper export --legacy --basepath ${baseUrl}`, {
    stdio: "inherit",
  });

  if (baseUrl !== "/") {
    await copy(join(".", "__sapper__", "export", baseUrl), join(".", "__sapper__", "export"));
    await remove(join(".", "__sapper__", "export", baseUrl));
  }

  try {
    if (await pathExists(join(".", "assets")))
      await copy(join(".", "assets"), join(".", "__sapper__", "export"), { recursive: true });
  } catch (error) {
    console.log("Got an error in copying assets", error);
  }

  const [owner, repo] = (process.env.GITHUB_REPOSITORY || "").split("/");

  if (
    config["status-website"] &&
    config["status-website"].cname &&
    config["status-website"].cname !== "info-devf5r.github.io/status-page"
  )
    await writeFile(join(".", "__sapper__", "export", "CNAME"), config["status-website"].cname);
  else if (
    config["status-website"] &&
    config["status-website"].cname &&
    config["status-website"].cname === "info-devf5r.github.io/status-page" &&
    owner === "info-devf5r" &&
    repo === "status-page"
  )
    await writeFile(join(".", "__sapper__", "export", "CNAME"), "info-devf5r.github.io/status-page");

  if (config["status-website"] && config["status-website"].robotsText)
    await writeFile(
      join(".", "__sapper__", "export", "robots.txt"),
      config["status-website"].robotsText
    );

  await copyFile(
    join(".", "__sapper__", "export", "service-worker-index.html"),
    join(".", "__sapper__", "export", "404.html")
  );
};

postProcess();
