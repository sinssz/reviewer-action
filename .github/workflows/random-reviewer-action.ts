import { context, getOctokit } from "@actions/github";
import { getInput, setFailed } from "@actions/core";
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

  const token =
    getInput("github_token") || process.env.github_token?.toString();

  if (!token) {
    setFailed("github client token is not set");
    return;
  }

  const githubClient = getOctokit(token);
  console.log("githubClient : ", githubClient);

  const { codeOwners } = getCodeOwners(yml) as {
    codeOwners: Reviewer[];
  };

  // pr 작성자
  const creator = context?.payload?.pull_request?.user.login;

  // pr 작성자를 제외한 멤버
  let candidates = codeOwners.filter((reviewer) => {
    return reviewer.githubName !== creator;
  });

  // 요청할 리뷰어가 없을 경우 종료
  if (!candidates.length) return;

  const reviewers = getReviewers(candidates, 2);

  reviewers.forEach(async (reviewer) => {
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

  // if (candidates.length > 0) {
  //   const firstReviewer = getRandomReviewer(candidates);
  //   candidates.splice(firstReviewer.index, 1);
  //   const secondReviewer = getRandomReviewer(candidates);

  //   [firstReviewer, secondReviewer].forEach(async (reviewer) => {
  //     await githubClient.rest.pulls.requestReviewers({
  //       owner: context.repo.owner,
  //       repo: context.repo.repo,
  //       pull_number: context.issue.number,
  //       reviewers: [reviewer.githubName],
  //     });

  //     sendDirectMessage({
  //       githubName: reviewer.githubName,
  //       slackUserId: reviewer.slackUserId,
  //     });
  //   });
  // }
}

const sendDirectMessage = async (reviewer: Reviewer) => {
  console.log("Send Message!!");
  // slackClient.chat.postMessage({
  //   text: createMessage(github.context),
  //   channel: reviewer.slackUserId,
  // });
};

// const getRandomReviewer = (candidates: Reviewer[]) => {
//   const memberIndex = Math.floor(Math.random() * candidates.length);
//   return {
//     githubName: candidates[memberIndex].githubName,
//     slackUserId: candidates[memberIndex].slackUserId,
//     index: memberIndex,
//   };
// };

// YAML 파일 읽기
const getCodeOwners = (filePath: string) => {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(fileContents);
    return data;
  } catch (error) {
    console.error(`Error reading YAML file: ${error}`);
    return null;
  }
};

const getReviewers = (candidates: Reviewer[], memberCnt: number) => {
  const maxElements = Math.min(memberCnt, candidates.length);
  const selectedElements: Reviewer[] = [];

  for (let i = 0; i < maxElements; i++) {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    selectedElements.push(candidates[randomIndex]);
    candidates.splice(randomIndex, 1);
  }

  return selectedElements;
};

main();
