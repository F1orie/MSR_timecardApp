/*
  【エラー解決用SQL】
  「Database error creating new user」が出る場合、このスクリプトを実行してください。
  
  原因: 削除したはずのユーザーが、認証システム(Auth)の裏側に残っているため。
  対策: 名簿(Profile)に存在しないAuthユーザーを一括削除します。
*/

DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);
