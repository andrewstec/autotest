import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {Course} from '../../model/business/CourseModel';
import {Deliverable} from '../../model/settings/DeliverableRecord';
import PushRepo from '../../repos/PushRepo';
import CourseRepo from '../../repos/CourseRepo';
import UserRepo from '../../repos/UserRepo';
import {User} from '../../model/business/UserModel';
import PushRecord, {Push} from '../../model/requests/PushRecord';
import DeliverableRepo from '../../repos/DeliverableRepo';


const BOT_USERNAME = 'autobot';

export interface DockerInputJSON {
  userInfo: DockerUserInfo;
  pushInfo: DockerPushInfo;
  githubKeys: DockerGithubKeys;
  deliverableInfo: DockerDeliverableInfo;
  dockerImage: string;
  githubOrg: string;
  whitelistedServers: string;
  allowDNS: number;
  courseNum: number;
  stdioRef: string;
  customHtml: boolean;
  rate: number;
  teamId: string;
  container: DockerContainerInfo;
  custom: object;
  postbackOnComplete: boolean;
}

export interface DockerGithubKeys {
  solutionsKey: string;
  delivKey: string;
  orgKey: string;
}

export interface DockerContainerInfo {
  image: string,
  exitCode: number,
}

export interface DockerUserInfo {
  username: string;
  fname: string;
  lname: string;
  csid: string;
  snum: string;
  profileUrl: string;
}

export interface DockerPushInfo {
  commit: string;
  branch: string;
  timestamp: number;
  commitUrl: string;
  projectUrl: string;
  repo: string;
}

export interface DockerDeliverableInfo {
  deliverableUrl: string; // Repo import to mark assignment (important if Github key not on image)
  deliverableCommit: string; // Commit of Deliverable soluton that will be marked in Docker container
  deliverableToMark: string;
  solutionsUrl: string;
}

export default class DockerInput {
  private config: IConfig;
  private course: Course;
  private user: User;
  private pushRecord: PushRecord;
  
  constructor(pushRecord: PushRecord, course: Course, user: User) {
    this.pushRecord = pushRecord;
    this.course = course;
    this.user = user;
    this.config = new AppConfig();
  }

  public createDockerInputJSON(deliverable: Deliverable): DockerInputJSON {
    let that = this;
    try {
      let userInfo: DockerUserInfo = {username: null, csid: null, snum: null, profileUrl: null, fname: null, lname: null};
      let pushInfo: DockerPushInfo = {branch: null, repo: null, commit: null, commitUrl: null, projectUrl: null, timestamp: null};
      let container: DockerContainerInfo = {image: null, exitCode: null};
      let githubKeys: DockerGithubKeys = {solutionsKey: null, delivKey: null, orgKey: null};
      let dockerImage: '';
      let deliverableInfo: DockerDeliverableInfo = {solutionsUrl: null, deliverableCommit: null, deliverableUrl: null, deliverableToMark: null};
      let dockerInput: DockerInputJSON = {
        userInfo, 
        pushInfo, 
        container,
        deliverableInfo,
        dockerImage,
        githubKeys,
        allowDNS: null,
        whitelistedServers: null,
        githubOrg: null, 
        custom: null, 
        customHtml: null,
        rate: null,
        teamId: null,
        courseNum: null,
        postbackOnComplete: null,
        // stdioRef matches container input so that we can always join objects easily and uniquely
        stdioRef:  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      };
        dockerInput.userInfo.csid = this.user.csid;
        dockerInput.userInfo.snum = this.user.snum;
        dockerInput.userInfo.fname = this.user.fname;
        dockerInput.userInfo.lname = this.user.lname;
        dockerInput.userInfo.username = this.user.username;
        dockerInput.userInfo.profileUrl = this.user.profileUrl;
        dockerInput.githubKeys.delivKey = deliverable.deliverableKey;
        dockerInput.githubKeys.solutionsKey = deliverable.solutionsKey;
        dockerInput.githubKeys.orgKey = this.config.getGithubToken();
        dockerInput.deliverableInfo.deliverableCommit = deliverable.commit;
        dockerInput.deliverableInfo.deliverableUrl = deliverable.url;
        dockerInput.deliverableInfo.deliverableToMark = deliverable.name;
        dockerInput.deliverableInfo.solutionsUrl = deliverable.solutionsUrl;
        dockerInput.pushInfo.branch = this.pushRecord.ref;
        dockerInput.pushInfo.commit = this.pushRecord.commit.short;
        dockerInput.pushInfo.commitUrl = this.pushRecord.commitUrl;
        dockerInput.pushInfo.projectUrl = this.pushRecord.projectUrl;
        dockerInput.pushInfo.repo = this.pushRecord.repo;
        dockerInput.pushInfo.timestamp = this.pushRecord.timestamp;
        dockerInput.container.image = deliverable.dockerOverride === false ? 'autotest/cpsc' + this.course.courseId + '__bootstrap' : 'autotest/cpsc' + this.course.courseId + '__' + deliverable.name + '__bootstrap';
        dockerInput.dockerImage = dockerInput.container.image;
        dockerInput.teamId = this.pushRecord.team;
        dockerInput.whitelistedServers = deliverable.whitelistedServers;
        dockerInput.allowDNS = deliverable.allowDNS;
        dockerInput.customHtml = deliverable.customHtml;
        dockerInput.rate = deliverable.rate;
        dockerInput.custom = deliverable.custom;
        dockerInput.courseNum = parseInt(this.course.courseId);          
        dockerInput.githubOrg = this.pushRecord.githubOrg;
        dockerInput.postbackOnComplete = deliverable.postbackOnComplete;
        return dockerInput;
    } catch (err) {
      Log.error(`DockerInput::DockerInputJSON() ERROR ${err}`);
    }
  }
}
