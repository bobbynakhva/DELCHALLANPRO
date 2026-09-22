alter table wo_issue
  add column if not exists doc_no text,
  add column if not exists remarks text,
  add column if not exists issued_date date;

insert into number_series (doc_type, prefix, next_no, pad)
values ('MIN', 'MIN/26-27/', 1, 4)
on conflict (doc_type) do nothing;
