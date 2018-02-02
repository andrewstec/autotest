import * as Url from 'url';

import {Commit} from '../GithubUtil';
import {Deliverable} from '../settings/DeliverableRecord'

export interface CourseSettings {
  bootstrapImage: string;
  testingDelay: boolean;
  delayTime: number;
  markDelivsByBatch: boolean;
  deliverables: { [id: string]: Deliverable };
}

export interface Course {
  _id: string;
  courseId: string;
  solutionsKey: string;
  delivKey: string;
  classList: Object[];
  staffList: [string];
  dockerImage: string;
  dockerBuild: string;
  containerBuilt: boolean;
  labSections: Object[];
  urlWebhook: string;
  githubOrgs: Object[];
  grades: Object[];
  description: string;
  admins: [string];
  custom: object;
}
