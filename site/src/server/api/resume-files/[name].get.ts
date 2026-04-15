import { getRouterParam } from "h3";
import { readResumeFile } from "../../utils/resume-files";

export default defineEventHandler(async (event) => {
  const fileName = getRouterParam(event, "name");
  return readResumeFile(fileName);
});
