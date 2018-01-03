import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {Database, QueryParameters, ViewResponse} from '../../model/Database';
// import TestRecord from '../../model/results/TestRecord'
import ResultRecordRepo from '../../repos/ResultRecordRepo';
import ResultRecord from './ResultRecord';


export default class GithubGradeComment {
  private config: IConfig;
  private team: string;
  private commit: string;
  private deliverable: string;
  private note: string;
  private orgName: string;
  private resultRecord: ResultRecord;

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
  }

  /**
   * Pulls the test/coverage results from the database.
   *
   * @param team - Team identifier.
   * @param commit - The GitHub commit SHA that the tests were run against.
   * @param deliverable - Deliverable identifier (i.e. d1, d2, etc.).
   */
  private async getResult(): Promise<ResultRecord> {
    let resultRecordRepo = new ResultRecordRepo();

    let that = this;
    return new Promise<ResultRecord>(async (fulfill, reject) => {
      try {
        // important: this query has to be done in descending order to get the latest result.

        // must make sure it is brought in as resultrecord 
        let resultRecord = await resultRecordRepo.getLatestResultRecord(this.team, this.commit, this.deliverable, this.orgName);

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

      let output: string = this.resultRecord.convertToJSON().githubFeedback;
      output += '\n\n<sub>suite: ' + 'test12' + '  |  script: ' + 'test21' + '.</sub>';

      return output;
    }
    catch(err) {
      Log.error(`GithubGradeComment::formatResult() ERROR creating result ${err}`);
    }
  }
}
