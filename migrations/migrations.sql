--CREATE SEQUENCE public.user_userid_seq
--	INCREMENT BY 1
--	MINVALUE 1
--	MAXVALUE 2147483647
--	START 1
--	CACHE 1
--	NO CYCLE;

--CREATE TABLE public.user_master (
--	userid int4 DEFAULT nextval('user_userid_seq'::regclass) NOT NULL,
--	username varchar NOT NULL,
--	userpwd varchar NOT NULL,
--	usertype varchar NOT NULL,
--	userlocation int4 NOT NULL,
--	CONSTRAINT user_master_check CHECK ((NOT NULL::boolean)),
--	CONSTRAINT user_pk PRIMARY KEY (userid)
--);

-- CREATE TABLE public.location_master (
-- 	id serial4 NOT NULL,
-- 	location_name varchar NOT NULL,
-- 	location_addr1 varchar NULL,
-- 	location_addr2 varchar NULL,
-- 	location_addr3 varchar NULL,
-- 	macid varchar NULL,
-- 	abbr varchar NULL,
-- 	CONSTRAINT location_master_pk PRIMARY KEY (id),
-- 	CONSTRAINT location_master_unique UNIQUE (abbr)
-- );

--CREATE TABLE public.employee_master (
--	id serial4 NOT NULL,
--	fname varchar NOT NULL,
--	lname varchar NOT NULL,
--	uanno varchar NULL,
--	esino varchar NULL,
--	doj date NULL,
--	doe date NULL,
--	fotourl varchar NULL,
--	location_id serial4 NOT NULL,
--	addr1 varchar NULL,
--	city varchar NULL,
--	state varchar NULL,
--	mobile varchar NULL,
--	email varchar NULL,
--	pincode varchar NULL,
--	addr2 varchar NULL,
--	CONSTRAINT employee_master_pk PRIMARY KEY (id),
--	CONSTRAINT employee_master_location_master_fk FOREIGN KEY (location_id) REFERENCES public.location_master(id)
--);
--CREATE UNIQUE INDEX employee_master_id_idx ON public.employee_master USING btree (id);

-- CREATE TABLE public.attendance (
-- 	"date" date NOT NULL,
-- 	"time" time NOT NULL,
-- 	empid int4 NOT NULL,
-- 	lat varchar NOT NULL,
-- 	long varchar NOT NULL,
-- 	"valid" boolean NOT NULL,
-- 	location_id int4 NOT NULL
-- );

-- ALTER TABLE public.location_master ADD lat varchar NULL;
-- ALTER TABLE public.location_master ADD long varchar NULL;
-- ALTER TABLE public.attendance ADD fotourl varchar NULL;
-- ALTER TABLE public.attendance DROP COLUMN "valid";
-- ALTER TABLE public.attendance ADD "inout" varchar NULL;
