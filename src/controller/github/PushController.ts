import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import PushRecord, {Push} from '../../model/requests/PushRecord';
import TestJobController from '../TestJobController';
import {Job} from '../../model/JobQueue';
import UserRepo from '../../repos/UserRepo';
import {User} from '../../model/business/UserModel';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {Course} from '../../model/business/CourseModel';
import {Deliverable} from '../../model/settings/DeliverableRecord';
import {TestJob} from '../TestJobController';
import PushRepo from '../../repos/PushRepo';
import CourseRepo from '../../repos/CourseRepo';
import DeliverableRepo from '../../repos/DeliverableRepo';
import DockerHelper, {DockerInputJSON} from '../../model/docker/DockerInput';

const BOT_USERNAME = 'autobot';
export const INIT_STATE = 'INIT';

export default class PushController {
  private config: IConfig;
  private runningPort: number;
  private deliverable: Deliverable;
  private deliverables: Deliverable[];
  private courseNum: number;
  private course: Course;
  private user: User;
  private record: PushRecord;
  private dockerHelper: DockerHelper;
  private dockerInput: DockerInputJSON;
  
  constructor(courseNum: number) {
    this.config = new AppConfig();
    this.courseNum = courseNum;
  }

  async process(data: JSON) {
    let that = this;
    this.record = new PushRecord(data);
    await this.store(this.record);
    this.deliverable = await this.getDeliverable();
    this.course = await this.getCourse();
    this.user = await this.getUserInfo();
    this.deliverables = await new DeliverableRepo().getDeliverables(this.courseNum);
    this.dockerHelper = await new DockerHelper(this.record, this.course, this.user);
    this.dockerInput = await this.dockerHelper.createDockerInputJSON(this.deliverable);

    let testsToMark = [];

    // IMPORTANT: REGRESSION TESTS
    // If a regression test is valid, it will match one of the Deliverable Names,
    // and therefore, we can attempt to grade the regression Test.
    if (this.deliverable.regressionTest) {
      let regressionTests = String(this.deliverable.regressionTests).match(/[^ ]+/g);
      this.deliverables.map((deliv) => {
        for (let i = 0; i < regressionTests.length; i++) {
          if (regressionTests[i] === deliv.name) {
            let dockerInput: DockerInputJSON = this.dockerHelper.createDockerInputJSON(deliv);
            that.markDeliverable(deliv, dockerInput);
          }
        }
      });
    }

    if (this.record.user === BOT_USERNAME) {
      try {
        throw `PushController::process() Recieved ${BOT_USERNAME} push from batch cloning repo. Ignoring 'Push'.`;
      }
      catch (err) {
        Log.info(err);
      }
    }
    else {
      // Always mark and return the incoming deliverable.
      return Promise.all(this.markDeliverable(this.deliverable, this.dockerInput));
    }
  }

  async getCourse() {
    try {
      let courseRepo: CourseRepo = new CourseRepo();
      return courseRepo.getCourse(this.courseNum)
        .then((course: Course) => {
          this.course = course;
          return course;
        })
        .then((course: Course) => {
          if (this.course) {
            return this.course;
          } else {
            throw `Could not find course ${this.courseNum}.`;
          }
        })
      } catch (err) {
        Log.error(`PushController::getDeliverableLogic() Failed to retrieve business logic for Course ${this.courseNum}: ${err}`);
        return null;
      }
  }

  private getUserInfo(): Promise<User> {
    let userRepo = new UserRepo();
    return userRepo.getUser(this.record.user)
      .then((user: User) => {
        if (user) {
          return user;
        }
        Log.warn(`DockerInput::getUserInfo() The user ${this.record.user} cannot be found in the DB. ` + 
          'DockerInput will have null user entries.')
      });
  }

  async getDeliverable() {
    try {
      let delivRepo: DeliverableRepo = new DeliverableRepo();
      return delivRepo.getDeliverable(this.record.deliverable, this.courseNum)
        .then((deliverable: Deliverable) => {
          this.deliverable = deliverable;
          return deliverable;
        })
        .then((deliv: Deliverable) => {
          if (this.deliverable) {
            return this.deliverable;
          } else {
            throw `Could not find deliverable for ${this.courseNum} course logic.`;
          }
        })
      } catch (err) {
        Log.error(`PushController::getDeliverableLogic() Failed to retrieve business logic for Course ${this.courseNum}: ${err}`);
        return null;
      }
  }

  /**
   * ENGRAINED FEATURE: DOCKER OVERRIDE 
   * Docker Override allows a professor to override the Course container for grade requests. Instead,
   * a Deliverable-specific container will run for this grade.
   * 
   * NOTE: REGRESSION TESTS
   * Regression tests will also be marked on the basis of the override mode.
   * 
   * NOTE: A Test Job is produced that compiles the necessary information to keep track of TestJobs
   * that are queued by the CommitCommentController, grades that are requested by the CommitCommentController,
   * running TestJobs in the TestRecord class, and storing grades in ResultRecords that are produced by the 
   * TestRecord/ResultRecord classes.
   */

  private markDeliverable(deliverable: Deliverable, dockerInput: DockerInputJSON): Promise<Job>[] {
    let that = this;
    let promises: Promise<Job>[] = [];
    let currentDate: Date = new Date();
    let record: PushRecord = this.record;

        let open: Date = new Date(deliverable.open);
        let close: Date = new Date(deliverable.close);
        let courseImage: string = 'autotest/cpsc' + this.course.courseId + '__bootstrap';
        let delivImage: string = 'autotest/cpsc' + this.course.courseId + '__' + this.deliverable.name + '__bootstrap';
        let dockerImage = deliverable.dockerOverride === false ? courseImage : delivImage;
        let testJob: TestJob;
        if (open <= currentDate && close >= currentDate) {
            testJob = {
              orgName: record.githubOrg,
              requestor: '',
              state: INIT_STATE,
              deliverable: deliverable.name,
              pendingRequest: false,
              repo: record.repo,
              projectUrl: record.projectUrl,
              commitUrl: record.commitUrl,
              closeDate: deliverable.close,
              openDate: deliverable.open,
              course: this.course,
              courseNum: this.courseNum,
              username: record.user,
              timestamp: record.timestamp,
              team: record.team,
              commit: record.commit.short,
              hook: record.commentHook,
              ref: record.ref,
              postbackOnComplete: deliverable.postbackOnComplete || false,
              test: {
                dockerInput: dockerInput,
                dockerOverride: deliverable.dockerOverride,
                dockerImage: dockerImage,
                stamp: 'autotest/' + dockerImage + ':master',
                deliverable: deliverable.name
              }
          } 
        } else {
          throw 'Commit ' + record.commit.short + ' cannot be graded because it is not available for marking before ' + open +
            ' and after ' + close;
        }
    promises.push(this.enqueue(testJob));          
    return promises;
  }

  private async store(record: PushRecord): Promise<any> {
    let pushRepo: PushRepo = new PushRepo();
    return pushRepo.insertPushRecord(this.record.convertToJSON());
  }

  private async enqueue(job: TestJob): Promise<Job> {
    let controller: TestJobController = TestJobController.getInstance(this.courseNum);
    return controller.addJob(job);
  }
}
