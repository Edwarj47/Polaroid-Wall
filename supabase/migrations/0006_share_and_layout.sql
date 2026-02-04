-- Share token + layout preference

alter table collections add column if not exists share_token text unique;
alter table collections add column if not exists wall_layout text default 'curved';
