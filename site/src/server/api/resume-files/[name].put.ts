import { getRouterParam, readBody, createError } from "h3";
import { writeResumeFile } from "../../utils/resume-files";

export default defineEventHandler(async (event) => {
  const fileName = getRouterParam(event, "name");
  const body = await readBody<{ markdown?: unknown }>(event);

  if (typeof body?.markdown !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "markdown must be a string"
    });
  }

  return writeResumeFile(fileName, body.markdown);
});
