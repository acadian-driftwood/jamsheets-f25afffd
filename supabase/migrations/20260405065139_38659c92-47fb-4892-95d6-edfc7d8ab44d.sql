
DROP POLICY IF EXISTS "Admin/TM can update show documents" ON storage.objects;

CREATE POLICY "Admin/TM can update show documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'show-documents'
    AND has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, ARRAY['owner'::org_role, 'admin'::org_role, 'tm'::org_role])
  );
