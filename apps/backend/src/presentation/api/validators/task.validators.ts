import { z } from 'zod';

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

/**
 * Zod schema for validating the create task request body.
 */
export const createTaskSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required.' })
            .trim()
            .min(1, { message: 'Title cannot be empty.' })
            .max(TITLE_MAX_LENGTH, { message: `Title cannot exceed ${TITLE_MAX_LENGTH} characters.` }),
    description: z.string({ required_error: 'Description is required.' })
                   .max(DESCRIPTION_MAX_LENGTH, { message: `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.` })
                   .default(''),
  }),
});


/**
 * Zod schema for validating the update task request body.
 * All fields are optional for partial updates.
 */
export const updateTaskSchema = z.object({
   params: z.object({
        taskId: z.string({ required_error: 'Task ID is required in URL path.' })
                 .uuid({ message: "Invalid Task ID format (must be UUID)."}),
    }),
  body: z.object({
    title: z.string()
            .trim()
            .min(1, { message: 'Title cannot be empty.' })
            .max(TITLE_MAX_LENGTH, { message: `Title cannot exceed ${TITLE_MAX_LENGTH} characters.` })
            .optional(),
    description: z.string()
                   .max(DESCRIPTION_MAX_LENGTH, { message: `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.` })
                   .optional(),
    isCompleted: z.boolean({ invalid_type_error: 'isCompleted must be a boolean.' })
                    .optional(),
  }).refine(data => Object.keys(data).length > 0, {
      message: "At least one field (title, description, or isCompleted) must be provided for update.",
      path: ["body"]
  }),
});

export const taskIdParamSchema = z.object({
    params: z.object({
        taskId: z.string({ required_error: 'Task ID is required in URL path.' })
                 .uuid({ message: "Invalid Task ID format (must be UUID)."}),
    }),
});