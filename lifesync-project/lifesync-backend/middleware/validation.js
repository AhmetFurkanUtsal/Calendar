const Joi = require("joi");

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation hatası",
        errors,
      });
    }

    req.body = value;
    next();
  };
};

// User schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Geçerli bir email adresi giriniz",
      "any.required": "Email adresi zorunludur",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Şifre en az 6 karakter olmalıdır",
      "any.required": "Şifre zorunludur",
    }),
    displayName: Joi.string().min(2).max(50).optional(),
    categories: Joi.array()
      .items(
        Joi.string().valid(
          "dini",
          "hayvanseverlik",
          "cevre",
          "kariyer",
          "saglik"
        )
      )
      .optional()
      .default([]),
    city: Joi.string().optional(),
    timezone: Joi.string().optional().default("Europe/Istanbul"),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    displayName: Joi.string().min(2).max(50).optional(),
    fullName: Joi.string().optional(),
    bio: Joi.string().max(500).optional(),
    city: Joi.string().optional(),
    language: Joi.string().valid("tr", "en").optional(),
  }),
};

// Task schemas
const taskSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      "string.min": "Görev başlığı boş olamaz",
      "string.max": "Görev başlığı 200 karakterden uzun olamaz",
      "any.required": "Görev başlığı zorunludur",
    }),
    description: Joi.string().max(1000).optional(),
    priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").required(),
    category: Joi.string()
      .valid("DINI", "HAYVANSEVERLIK", "CEVRE", "KARIYER", "SAGLIK", "KISISEL")
      .required(),
    dueDate: Joi.date().iso().optional(),
    eisenhowerQuadrant: Joi.number().min(1).max(4).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    subtasks: Joi.array()
      .items(
        Joi.object({
          title: Joi.string().required(),
        })
      )
      .optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "URGENT").optional(),
    category: Joi.string()
      .valid("DINI", "HAYVANSEVERLIK", "CEVRE", "KARIYER", "SAGLIK", "KISISEL")
      .optional(),
    dueDate: Joi.date().iso().optional(),
    eisenhowerQuadrant: Joi.number().min(1).max(4).optional(),
    isCompleted: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

// Event schemas
const eventSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).optional(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date()
      .iso()
      .greater(Joi.ref("startTime"))
      .required()
      .messages({
        "date.greater": "Bitiş zamanı başlangıç zamanından sonra olmalıdır",
      }),
    isAllDay: Joi.boolean().optional().default(false),
    category: Joi.string()
      .valid("DINI", "HAYVANSEVERLIK", "CEVRE", "KARIYER", "SAGLIK", "KISISEL")
      .required(),
    location: Joi.object({
      name: Joi.string().optional(),
      address: Joi.string().optional(),
      lat: Joi.number().optional(),
      lng: Joi.number().optional(),
    }).optional(),
    recurrence: Joi.object({
      frequency: Joi.string()
        .valid("daily", "weekly", "monthly", "yearly")
        .required(),
      interval: Joi.number().min(1).optional().default(1),
      endDate: Joi.date().iso().optional(),
      daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)).optional(),
    }).optional(),
    reminders: Joi.array()
      .items(
        Joi.object({
          minutesBefore: Joi.number().min(0).required(),
          type: Joi.string().valid("NOTIFICATION", "EMAIL", "SMS").required(),
        })
      )
      .optional(),
  }),
};

// Note schemas
const noteSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    blocks: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid("text", "heading", "list", "todo", "image", "code")
            .required(),
          content: Joi.any().required(),
          properties: Joi.object().optional(),
        })
      )
      .required(),
    category: Joi.string()
      .valid("DINI", "HAYVANSEVERLIK", "CEVRE", "KARIYER", "SAGLIK", "KISISEL")
      .optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    attachedToType: Joi.string().valid("event", "task").optional(),
    attachedToId: Joi.string().optional(),
  }),
};

// AI schemas
const aiSchemas = {
  chat: Joi.object({
    message: Joi.string().min(1).max(1000).required().messages({
      "string.min": "Mesaj boş olamaz",
      "string.max": "Mesaj 1000 karakterden uzun olamaz",
      "any.required": "Mesaj zorunludur",
    }),
    context: Joi.object({
      currentDate: Joi.date().iso().optional(),
      userLifestyle: Joi.array().items(Joi.string()).optional(),
      upcomingEvents: Joi.array().optional(),
      pendingTasks: Joi.array().optional(),
      location: Joi.string().optional(),
    }).optional(),
  }),

  voice: Joi.object({
    audioData: Joi.string().required(),
    context: Joi.object().optional(),
  }),
};

module.exports = {
  validate,
  userSchemas,
  taskSchemas,
  eventSchemas,
  noteSchemas,
  aiSchemas,
};
