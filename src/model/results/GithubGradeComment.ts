import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import ResultRecordRepo from '../../repos/ResultRecordRepo';
import ResultRecord, {Result} from './ResultRecord';


export default class GithubGradeComment {
  private config: IConfig;
  private team: string;
  private commit: string;
  private postbackOnComplete: boolean;
  private deliverable: string;
  private note: string;
  private orgName: string;
  private resultRecord: Result;

  constructor(team: string, shortCommit: string, deliverable: string, orgName: string, note: string) {
    this.config = new AppConfig();
    this.team = team;
    this.commit = shortCommit;
    this.orgName = orgName;
    this.deliverable = deliverable;
    this.note = note;
  }

  public async fetch() {
    this.resultRecord = await this.getResult();
    this.postbackOnComplete = this.resultRecord.postbackOnComplete;
  }

  public getPostbackOnComplete(): boolean {
    return this.postbackOnComplete;
  }

  /**
   * Pulls the test/coverage results from the database.
   *
   * @param team - Team identifier.
   * @param commit - The GitHub commit SHA that the tests were run against.
   * @param deliverable - Deliverable identifier (i.e. d1, d2, etc.).
   */
  private async getResult(): Promise<Result> {
    let resultRecordRepo = new ResultRecordRepo();

    let that = this;
    return new Promise<Result>(async (fulfill, reject) => {
      try {
        // IMPORTANT: This query cannot be done in ascending order without slowing down async tasks
        // that work with the queue to produce reliable Grade/CommitComment grading request results.
        // Must be super quick. No descending/ascending sort. Only indexed ready to go stuff.
        let resultRecord = await resultRecordRepo.getResultRecord(this.team, this.commit, this.deliverable, this.orgName);
        fulfill(resultRecord)
      } catch(err) {
        reject('Unable to get test result for ' + this.team + ' commit ' + this.commit + '. ' + err);
      }
    });
  }


  /**
   * Formats the resultRecord as a Markdown string suitable for display on GitHub.
   *
   * @param resultRecord
   */
  public formatResult(): string {
    try {

      let output: string = this.resultRecord.githubFeedback;
      output += '\n\n<sub>suite: ' + this.resultRecord.container.image + '  |  script: ' + 'W2.0' + '.</sub>';

      return output;
    }
    catch(err) {
      Log.error(`GithubGradeComment::formatResult() ERROR creating result ${err}`);
    }
  }
}
