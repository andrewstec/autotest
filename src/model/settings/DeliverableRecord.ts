import * as Url from 'url';
import {Commit} from '../GithubUtil';

export interface Deliverable {
  _id: string;
  url: string;
  commit: string;
  solutionsUrl: string;
  open: number;
  close: number;
  name: string;
  customHtml: boolean;
  buildingRepos: string;
  courseId: string;
  gradesReleased: boolean;
  projectCount: number;
  teamsInSameLab: boolean;
  studentsMakeTeams: boolean;
  teamsAllowed: boolean;
  postbackOnComplete: boolean;
  maxTeamSize: number;
  minTeamSize: number;
  dockerOverride: boolean;
  dockerImage: string;
  regressionTest: boolean;
  regressionTests: string;
  containerBuilt: boolean;
  allowDNS: number;
  whitelistedServers: string;
  deliverableKey: string;
  solutionsKey: string;
  custom: object;
  rate: number;
}

export enum Visibility {
  Public,
  Private,
  Restricted
}

export interface Repository {
  name: string;  // name of the repo on GitHub
  url: Url.Url;
  commit?: Commit;
  visibility: Visibility;
}

export interface DeliverableSettings {
  description?: string;
  dueDate: Date;
  releaseDate: Date;
  repos: Repository[];
  gradeFormula: string;
  rate: number;  // milliseconds
  runs?: number;  // total number of requests to view test results
  // external servers that should be accessible inside the test container
  externalUrls?: Url.Url[];
}


export class DeliverableRecord {
 private _deliverables: { [id: string]: Deliverable } = {};

  constructor(deliverables: { [id: string]: Deliverable }) {
    for (const key of Object.keys(deliverables)) {
      if (key.match(/[1-3a-zA-Z]+\d+/)) {
        this.add(key, deliverables[key])
      }
    }
  }

  get deliverables() {
    return this._deliverables;
  }

  public add(name: string, deliverable: Deliverable) {
    // TODO Will this overwrite the value? Hope so.
    this._deliverables[name] = deliverable;
  }

  public remove(name: string) {
    // TODO Does this work?
    this._deliverables[name] = null;
  }

  public item(key: string): Deliverable {
    return this._deliverables[key];
  }

  public keys(): string[] {
    return Object.keys(this._deliverables);
  }

  public values(): Deliverable[] {
    let values: Deliverable[] = [];

    for (const key of Object.keys(this._deliverables)) {
      values.push(this._deliverables[key]);
    }
    return values;
  }

  public containsKey(key: string): boolean {
    return this._deliverables.hasOwnProperty(key);
  }
}