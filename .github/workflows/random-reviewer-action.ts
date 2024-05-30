import { context, getOctokit } from "@actions/github";
import { getInput } from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

// YAML 파일 경로 설정
const yml = path.join(__dirname, "../../", "reviewer.yml");

function main() {
  console.log("random job step start", context);
  const token = getInput("github_token");
  console.log("@@@@", token);
  const { reviewers } = getReviewers(yml) as {
    reviewers: { githubName: string; slackUserId: string }[];
  };

  if (reviewers.length > 0) {
    // await githubClient.rest.pulls.requestReviewers({
    //   owner: github.context.repo.owner,
    //   repo: github.context.repo.repo,
    //   pull_number: github.context.issue.number,
    //   reviewers: [selectedReviewer.githubName],
    // });
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
