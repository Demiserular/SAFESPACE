-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.anonymous_feedback (
  id bigint NOT NULL DEFAULT nextval('anonymous_feedback_id_seq'::regclass),
  feedback_id uuid NOT NULL UNIQUE,
  submission_date date NOT NULL,
  satisfaction_rating text NOT NULL,
  usage_frequency text NOT NULL,
  feature_rating jsonb,
  improvement_areas ARRAY,
  feature_request text,
  general_feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT anonymous_feedback_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_messages (
  id integer NOT NULL DEFAULT nextval('chat_messages_id_seq'::regclass),
  chat_room_id integer,
  user_id integer,
  content text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_chat_room_id_fkey FOREIGN KEY (chat_room_id) REFERENCES public.chat_rooms(id),
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.chat_rooms (
  id integer NOT NULL DEFAULT nextval('chat_rooms_id_seq'::regclass),
  name character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  description text,
  category text,
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comments (
  id integer NOT NULL DEFAULT nextval('comments_id_seq'::regclass),
  post_id integer,
  user_id integer,
  content text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.likes (
  id integer NOT NULL DEFAULT nextval('likes_id_seq'::regclass),
  user_id integer,
  post_id integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT likes_pkey PRIMARY KEY (id),
  CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.posts (
  id integer NOT NULL DEFAULT nextval('posts_id_seq'::regclass),
  user_id integer,
  title character varying NOT NULL,
  content text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);