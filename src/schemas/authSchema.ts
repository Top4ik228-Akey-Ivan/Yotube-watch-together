import { z } from 'zod';

export const authSchema = z
  .object({
    mode: z.enum(['host', 'guest']), // Режим: создатель или гость
    username: z
      .string()
      .min(2, 'Имя должно быть не короче 2 символов')
      .max(15, 'Имя не должно превышать 15 символов'),
    videoUrl: z.string().optional(), // Делаем опциональными для первичного парсинга
    roomId: z.string().optional(),
  })
  // Условная валидация бизнес-логики
  .superRefine((data, ctx) => {
    // Если пользователь — Создатель (Host)
    if (data.mode === 'host') {
      if (!data.videoUrl || data.videoUrl.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для создания комнаты обязательна ссылка на видео',
          path: ['videoUrl'],
        });
      } else {
        // Проверяем, что ссылка ведет именно на YouTube
        const isYouTube = /(youtube\.com|youtu\.be)/i.test(data.videoUrl);
        if (!isYouTube) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Поддерживаются только ссылки на YouTube ролики',
            path: ['videoUrl'],
          });
        }
      }
    }

    // Если пользователь — Гость (Guest)
    if (data.mode === 'guest') {
      if (!data.roomId || data.roomId.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для входа необходимо ввести ID комнаты друга',
          path: ['roomId'],
        });
      }
    }
  });

// Автоматический экспорт типа для TypeScript
export type AuthFormValues = z.infer<typeof authSchema>;
