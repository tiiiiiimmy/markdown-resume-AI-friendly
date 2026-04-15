import { listResumeFiles } from "../../utils/resume-files";

export default defineEventHandler(async () => ({
  items: await listResumeFiles()
}));
