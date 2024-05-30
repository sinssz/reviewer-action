import { context, getOctokit } from "@actions/github";
import { getInput } from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

interface Reviewer {
  githubName: string;
  slackUserId: string;
}

// YAML 파일 경로 설정
const yml = path.join(__dirname, "../../", "reviewer.yml");

function main() {
  console.log("random job step start");

  const token = getInput("github_token");
  console.log("token : ", token, process.env.github_token);
  const githubClient = getOctokit(token);
  console.log("githubClient : ", githubClient);

  const { reviewers } = getReviewers(yml) as {
    reviewers: Reviewer[];
  };

  const creator = context?.payload?.pull_request?.user.login;
  let candidates = reviewers.filter((reviewer) => {
    return true;
    return reviewer.githubName !== creator;
  });

  if (candidates.length > 0) {
    const firstReviewer = getRandomReviewer(candidates);
    candidates.splice(firstReviewer.index, 1);
    const secondReviewer = getRandomReviewer(candidates);

    [firstReviewer, secondReviewer].forEach(async (reviewer) => {
      await githubClient.rest.pulls.requestReviewers({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.issue.number,
        reviewers: [reviewer.githubName],
      });

      sendDirectMessage({
        githubName: reviewer.githubName,
        slackUserId: reviewer.slackUserId,
      });
    });
  }
}

const sendDirectMessage = async (reviewer: Reviewer) => {
  // slackClient.chat.postMessage({
  //   text: createMessage(github.context),
  //   channel: reviewer.slackUserId,
  // });
};

const getRandomReviewer = (candidates: Reviewer[]) => {
  const memberIndex = Math.floor(Math.random() * candidates.length);
  return {
    githubName: candidates[memberIndex].githubName,
    slackUserId: candidates[memberIndex].slackUserId,
    index: memberIndex,
  };
};

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
