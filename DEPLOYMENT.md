# デプロイ手順ガイド

デプロイ（Web上への公開）おめでとうございます！
このプロジェクトは **Next.js** と **Supabase** を使用しているため、**Vercel** というホスティングサービスへのデプロイが最もスムーズです。

以下に手順をまとめました。

## 1. GitHubへの最新コードの反映

まず、手元のコードがすべてGitHubにアップロードされているか確認してください。
ターミナルで以下のコマンドを実行して、変更を反映させます。

```bash
git add .
git commit -m "Deployment ready"
git push origin main
```
※ すでに最新の状態であれば `Everything up-to-date` と表示されます。

## 2. Vercelのアカウント作成・ログイン

1. [Vercelの公式サイト](https://vercel.com/) にアクセスします。
2. 右上の **"Sign Up"** (または Log In) をクリックします。
3. **"Continue with GitHub"** を選択して、GitHubアカウントでログインします。

## 3. プロジェクトのインポート

1. Vercelのダッシュボード（一覧画面）にある **"Add New..."** ボタンをクリックし、**"Project"** を選択します。
2. 左側の **"Import Git Repository"** のリストに、あなたのリポジトリ `MSR_timecardApp` が表示されているはずです。
3. その横にある **"Import"** ボタンをクリックします。

## 4. デプロイ設定 (最重要)

**Configure Project** という画面になります。ここで環境変数を設定する必要があります。

1. **Environment Variables** という項目をクリックして展開します。
2. 手元の `.env.local` ファイルの内容をコピーして貼り付けます。

以下の3つの変数を追加してください（KeyとValueのペアで入力します）：

| Key (名前) | Value (値) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ytuxxysoaocyvtqmpvrs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ojixmLVP8...` (あなたのファイルの値をコピー) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJI...` (あなたのファイルの値をコピー) |

※ `.env.local` の中身をそのままコピペする機能（Paste your .env ...）もあるので、それを使うと簡単です。

## 5. デプロイ実行

1. 設定が終わったら、下の **"Deploy"** ボタンをクリックします。
2. ビルドが始まります。1〜2分ほど待ちます。
3. 画面に紙吹雪が舞ったら成功です！ **"Continue to Dashboard"** をクリックします。
4. **"Visit"** ボタンを押すと、実際に公開されたサイトにアクセスできます。

## 6. Supabaseの設定確認 (デプロイ後)

公開されたサイトのURL（例: `https://msr-timecard-app.vercel.app`）をコピーして、Supabase側の設定に追加する必要があります。

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセスします。
2. プロジェクト設定 > **Authentication** > **URL Configuration** に進みます。
3. **Site URL** に、今のVercelのURLを入力して保存します。
4. これでログイン後のリダイレクトが正常に動作するようになります。
