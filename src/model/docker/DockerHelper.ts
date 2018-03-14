import Log from '../../Util';
import {IConfig, AppConfig} from '../../Config';
import {DeliverableRecord} from '../../model/settings/DeliverableRecord';
import {Course} from '../../model/business/CourseModel';
import {Deliverable} from '../../model/settings/DeliverableRecord';

export class DockerHelper {
  constructor() {

  }

  /**
   * Produces a dockerImage tag to be used in the Queue based on if Docker Image is Course-wide or 
   * Deliverable-specific container.
   * 
   * @param Deliverable We read the name and if override is enabled.
   * @return String 'autotest/cpsc210__bootstrap' or 'autotest/cpsc210__d3__bootstrap' type string.
   */
  public getDockerImageTag(deliv: Deliverable, courseNum: number) {
    const PREPEND = 'autotest/cpsc';
    const APPEND = 'bootstrap';
    let courseId = String(courseNum);
    let imageTag: string = '';

    try {

      if (deliv.dockerOverride) {
        imageTag = PREPEND + courseId + '__' + deliv.name + '__' + APPEND;
        return imageTag;
      } else {
        imageTag = PREPEND + courseId + '__' + APPEND;
        return imageTag;
      }
    }
    catch (err) {
      Log.error('DockerHelper:: Could not create Docker Image tag ' + err);
    }

  }

}

const dockerHelper = new DockerHelper();

export default dockerHelper;