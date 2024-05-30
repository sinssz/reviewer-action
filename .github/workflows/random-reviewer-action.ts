import * as github from "@actions/github";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

// YAML 파일 경로 설정
const yml = path.join(__dirname, "../../", "reviewer.yml");

function main() {
  console.log("random job step start", github.context.payload.pull_request);
  const { reviewers } = getReviewers(yml) as {
    reviewers: { githubName: string; slackUserId: string }[];
  };

  if (reviewers.length > 0) {
  }
}

// YAML 파일 읽기
const getReviewers = (filePath: string) => {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(fileContents);
    return data;
  } catch (error) {
    console.error(`Error reading YAML file: ${error}`);
    return null;
  }
};

main();
