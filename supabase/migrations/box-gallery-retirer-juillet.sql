-- Retire de la galerie « Exemples de box » la photo de la box de juillet
-- (image générée par IA, pas une vraie photo). Rien n'est supprimé : la
-- ligne est simplement dépubliée, réversible en remettant is_published à true.
-- Vérifier d'abord ce qui sera touché :
-- select id, caption, storage_path, is_published from public.box_motif_gallery order by sort_order desc;

update public.box_motif_gallery
set is_published = false
where caption ilike '%juillet%';
