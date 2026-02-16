# タスクリスト（複数人開発版）

## タスク構成の方針

- **フェーズ1（初期設定）**: 1人が担当、基盤を構築
- **フェーズ2（並列開発）**: 3-4人が並列作業、各自が独立したタスクを実行
- **フェーズ3（統合・品質保証）**: 全員で統合テストとドキュメント作成
- **テスト戦略**: 各開発者が自分の担当機能のユニットテスト・プロパティテストを実装と並行して作成

---

## フェーズ1: 初期設定（1人担当、順序実行）

### 担当者: 初期設定担当者

- [x] 1.1 プロジェクト初期化とディレクトリ構造作成
  - pnpmでTypeScript/Node.jsプロジェクトの初期化
  - ディレクトリ構造の作成（domain, application, infrastructure, presentation）
  - 依存関係のインストール:
    - TypeScript, tsup (ビルド)
    - better-sqlite3 (データベース)
    - commander (CLIパーサー)
    - ulid (ID生成)
    - dotenv (環境変数)
  - tsconfig.json, tsup.config.ts の設定

- [x] 1.2 テスト環境のセットアップ
  - Vitest + fast-check のセットアップ
  - vitest.config.ts の設定
  - テスト用データベースの設定（インメモリSQLite）

- [x] 1.3 ドメイン層の基礎実装
  - [x] 1.3.1 値オブジェクトの実装（IdeaId, ChunkId, AnalysisId, TagCategory）
  - [x] 1.3.2 ドメインエラーの実装（DomainError, ValidationError, NotFoundError, LLMServiceError, DatabaseError）
  - [x] 1.3.3 Result型の実装（Result<T, E>, Success<T>, Failure<E>）
  - [x] 1.3.4 エンティティの実装（Tag, Chunk, Suggestion, Analysis, Idea）
    - Ideaエンティティに archivedAt フィールドを追加
    - archive(), restore(), isArchived() メソッドを実装
  - [x] 1.3.5 リポジトリインターフェースの定義（IIdeaRepository）
  - [x] 1.3.6 LLMサービスインターフェースの定義（ILLMService）
  - [x] 1.3.7 ドメイン層のユニットテスト

- [x] 1.4 インフラストラクチャ層の実装
  - [x] 1.4.1 データベーススキーマの作成
    - ideas テーブル（archived_at カラム追加）
    - chunks, tags, analyses, analysis_tags テーブル
  - [x] 1.4.2 SQLiteIdeaRepositoryの実装
    - save, findById, findAll, update メソッド
    - findAllActive, findAllArchived メソッド（フィルタ対応）
    - findByTag メソッド（タグフィルタ）
  - [x] 1.4.3 OllamaLLMServiceの実装
    - generateTags, generateSuggestion メソッド
    - checkConnection メソッド（接続確認）
    - JSONレスポンスのパース処理
  - [x] 1.4.4 設定ファイル読み込み機能の実装
    - config.json の読み込み
    - 環境変数による上書き
  - [x] 1.4.5 インフラ層の統合テスト

- [x] 1.5 API層の共通型定義
  - [x] 1.5.1 APIResponse<T>型とAPIError型の定義
  - [x] 1.5.2 DTOの実装（IdeaSummary, IdeaDetail, ChunkDetail, TagDetail, AnalysisDetail, SuggestionDTO）

- [x] 1.6 テスト用モック実装
  - [x] 1.6.1 MockIdeaRepositoryの実装（インメモリ）
  - [x] 1.6.2 MockLLMServiceの実装（固定レスポンス）
  - [x] 1.6.3 モック実装のユニットテスト

**フェーズ1完了の定義**: ドメイン層、インフラ層、API共通型、モック実装が完成し、他の開発者が並列作業を開始できる状態

---

## フェーズ2: 並列開発（3-4人が並列作業）

### 担当者A: コマンド系機能

- [x] 2A.1 バリデーション付きRequestオブジェクトの実装
  - AddIdeaRequestクラス（バリデーション付き）
  - AppendChunkRequestクラス（バリデーション付き）
  - AddTagRequestクラス（バリデーション付き）
  - RemoveTagRequestクラス（バリデーション付き）
  - ArchiveIdeaRequestクラス（バリデーション付き）
  - RestoreIdeaRequestクラス（バリデーション付き）
  - Requestオブジェクトのユニットテスト

- [x] 2A.2 Responseオブジェクトの定義
  - AddIdeaResponse, AppendChunkResponse, AddTagResponse, RemoveTagResponseの定義
  - ArchiveIdeaResponse, RestoreIdeaResponseの定義

- [x] 2A.3 コマンド系ユースケースの実装
  - AddIdeaUseCaseの実装（Result型を返す）
  - AppendChunkUseCaseの実装（Result型を返す）
  - AddTagUseCaseの実装（Result型を返す）
  - RemoveTagUseCaseの実装（Result型を返す）
  - ArchiveIdeaUseCaseの実装（Result型を返す）
  - RestoreIdeaUseCaseの実装（Result型を返す）
  - ユースケースのユニットテスト（モックリポジトリを使用）

- [x] 2A.4 IdeaCommandAPIの実装
  - IdeaCommandAPIクラスの実装（addIdea, appendChunk, addTag, removeTag, archiveIdea, restoreIdeaメソッド）
  - Result型からAPIResponseへの変換ロジック実装
  - IdeaCommandAPIのユニットテスト（モックユースケースを使用）

- [x] 2A.5 CLIコマンドハンドラーの実装（コマンド系）
  - handleAddCommandの実装
  - handleAppendCommandの実装
  - handleAddTagCommandの実装
  - handleRemoveTagCommandの実装
  - handleArchiveCommandの実装
  - handleRestoreCommandの実装
  - コマンドハンドラーのユニットテスト（モックAPIを使用）

- [x] 2A.6 プロパティベーステスト（コマンド系）
  - プロパティ1: アイデア保存のラウンドトリップ
  - プロパティ4: 空文字列入力の拒否
  - プロパティ5: チャンク追加のラウンドトリップ
  - プロパティ6: チャンク追加時の元データ不変性
  - プロパティ15: タグ追加のラウンドトリップ
  - プロパティ16: タグ追加と削除の往復

### 担当者B: クエリ系機能

- [ ] 2B.1 バリデーション付きRequestオブジェクトの実装
  - ListIdeasRequestクラスの実装
    - limit オプション（デフォルト10）
    - tag フィルタオプション（複数指定可能）
    - archived フィルタオプション（--archived, --all）
  - ShowIdeaRequestクラス（バリデーション付き）
  - Requestオブジェクトのユニットテスト

- [ ] 2B.2 Responseオブジェクトの定義
  - ListIdeasResponse, ShowIdeaResponseの定義

- [ ] 2B.3 クエリ系ユースケースの実装
  - ListIdeasUseCaseの実装（Result型を返す）
    - リミット対応
    - タグフィルタ対応
    - アーカイブフィルタ対応
  - ShowIdeaUseCaseの実装（Result型を返す）
  - ユースケースのユニットテスト（モックリポジトリを使用）

- [ ] 2B.4 IdeaQueryAPIの実装
  - IdeaQueryAPIクラスの実装（listIdeas, showIdeaメソッド）
  - Result型からAPIResponseへの変換ロジック実装
  - IdeaQueryAPIのユニットテスト（モックユースケースを使用）

- [ ] 2B.5 CLIコマンドハンドラーの実装（クエリ系）
  - handleListCommandの実装
    - --limit オプション
    - --tag オプション（複数指定可能）
    - --archived, --all オプション
  - handleShowCommandの実装
  - コマンドハンドラーのユニットテスト（モックAPIを使用）

- [ ] 2B.6 プロパティベーステスト（クエリ系）
  - プロパティ2: アイデアIDの一意性
  - プロパティ7: 存在しないIDへの操作エラー
  - プロパティ8: アイデア一覧の完全性
  - プロパティ9: アイデア一覧の時系列ソート
  - プロパティ10: アイデア詳細の完全性
  - プロパティ11: チャンク表示時の日時情報

### 担当者C: 分析系機能

- [ ] 2C.1 バリデーション付きRequestオブジェクトの実装
  - AnalyzeIdeaRequestクラス（バリデーション付き）
  - SuggestActionRequestクラス（バリデーション付き、analysisIdパラメータ対応）
  - Requestオブジェクトのユニットテスト

- [ ] 2C.2 Responseオブジェクトの定義
  - AnalyzeIdeaResponse, SuggestActionResponseの定義

- [ ] 2C.3 分析系ユースケースの実装
  - AnalyzeIdeaUseCaseの実装（Result型を返す）
  - SuggestActionUseCaseの実装（analysisIdパラメータ対応、Result型を返す）
  - ユースケースのユニットテスト（モックリポジトリとモックLLMサービスを使用）

- [ ] 2C.4 IdeaAnalysisAPIの実装
  - IdeaAnalysisAPIクラスの実装（analyzeIdea, suggestActionメソッド）
  - Result型からAPIResponseへの変換ロジック実装
  - IdeaAnalysisAPIのユニットテスト（モックユースケースを使用）

- [ ] 2C.5 CLIコマンドハンドラーの実装（分析系）
  - handleAnalyzeCommandの実装
  - handleSuggestCommandの実装（analysisIdパラメータ対応）
  - コマンドハンドラーのユニットテスト（モックAPIを使用）

- [ ] 2C.6 プロパティベーステスト（分析系）
  - プロパティ12: LLMサービスの呼び出し
  - プロパティ13: タグ保存のラウンドトリップ
  - プロパティ14: LLM通信エラーの適切な処理
  - プロパティ17: 提案保存のラウンドトリップ
  - プロパティ18: 分析結果の追加
  - プロパティ19: 分析追加時の既存データ不変性
  - プロパティ20: 分析履歴の時系列ソート

### 担当者D（オプション）: 統合・設定

- [ ] 2D.1 CLIコントローラーの実装
  - CLIControllerクラスの実装（3つのAPIファサードを注入）
  - Commander.jsによるコマンド解析ロジックの実装
  - サブコマンド構造の定義（tag add, tag remove）

- [ ] 2D.2 CLIエントリーポイントの実装
  - main関数の実装
  - コマンドライン引数の解析
  - ヘルプメッセージの実装
  - .idea-poolディレクトリの初期化処理

- [ ] 2D.3 DIコンテナの実装
  - DIContainerクラスの実装
  - リポジトリ、LLMサービス、ユースケース、APIファサード、CLIコントローラーの生成メソッド実装
  - DIコンテナのユニットテスト

- [ ] 2D.4 プロパティベーステスト（共通）
  - プロパティ3: エンティティ作成時のタイムスタンプ記録
  - プロパティ21: 不正コマンドのエラーハンドリング

**フェーズ2完了の定義**: 各機能（コマンド系、クエリ系、分析系）が独立して動作し、ユニットテスト・プロパティテストが完了している状態

---

## フェーズ3: 統合・品質保証（全員で作業）

### 統合テスト

- [ ] 3.1 E2Eテスト: 基本フロー
  - `idea add` → `idea list` → `idea show` の一連の流れ
  - `idea add` → `idea append` → `idea show` の追記フロー

- [ ] 3.2 E2Eテスト: 分析フロー
  - `idea add` → `idea analyze` → `idea suggest` の分析フロー
  - `idea add` → `idea analyze` → `idea suggest` (analysisId指定) の再現性テスト

- [ ] 3.3 E2Eテスト: タグ管理フロー
  - `idea add` → `idea tag add` → `idea show` → `idea tag remove` のタグ管理フロー

- [ ] 3.4 E2Eテスト: アーカイブフロー
  - `idea add` → `idea archive` → `idea list` (非表示確認) → `idea list --archived` (表示確認)
  - `idea restore` → `idea list` (復元確認)

- [ ] 3.5 統合テストの実行と問題修正
  - 全機能の統合動作確認
  - 発見された問題の修正

### ドキュメントとビルド

- [ ] 3.6 READMEの作成
  - インストール手順
  - 使用方法
  - コマンド一覧
  - 設定方法

- [ ] 3.7 ビルドスクリプトの作成
  - TypeScriptのビルド設定
  - 実行可能ファイルの生成
  - パッケージング

- [ ] 3.8 CI/CDの設定
  - テスト自動実行の設定
  - ビルド自動化の設定

**フェーズ3完了の定義**: 全機能が統合され、E2Eテスト（基本・分析・タグ・アーカイブ）が通過し、ドキュメントが完成している状態

---

## タスク依存関係の可視化

```text
フェーズ1（初期設定担当者）
  1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6

フェーズ2（並列開発）※フェーズ1完了後に開始
  ┌─ 2A.1 → 2A.2 → 2A.3 → 2A.4 → 2A.5 → 2A.6 （担当者A）
  ├─ 2B.1 → 2B.2 → 2B.3 → 2B.4 → 2B.5 → 2B.6 （担当者B）
  ├─ 2C.1 → 2C.2 → 2C.3 → 2C.4 → 2C.5 → 2C.6 （担当者C）
  └─ 2D.1 → 2D.2 → 2D.3 → 2D.4             （担当者D）

フェーズ3（統合・品質保証）※フェーズ2完了後に開始
  3.1, 3.2, 3.3, 3.4 → 3.5 → 3.6, 3.7, 3.8
```

---

## 開発者の作業開始タイミング

| 開発者 | 開始タイミング | 待機時間 | 担当範囲 |
|--------|---------------|---------|---------|
| 初期設定担当者 | 即座 | なし | フェーズ1全体 |
| 担当者A | フェーズ1完了後 | フェーズ1の期間 | コマンド系機能 |
| 担当者B | フェーズ1完了後 | フェーズ1の期間 | クエリ系機能 |
| 担当者C | フェーズ1完了後 | フェーズ1の期間 | 分析系機能 |
| 担当者D | フェーズ1完了後 | フェーズ1の期間 | 統合・設定 |
| 全員 | フェーズ2完了後 | フェーズ1+2の期間 | E2E・ドキュメント |

---

## 注意事項

- **フェーズ1の重要性**: フェーズ1が完了するまで、他の開発者は作業を開始できません。初期設定担当者は迅速かつ正確に基盤を構築してください
- **モックの活用**: フェーズ2では、各開発者がモックリポジトリ・モックLLMサービスを使用してテストを作成します
- **テストファースト**: 各開発者は実装と並行してユニットテスト・プロパティテストを作成してください（TDDを推奨）
- **プロパティテストの設定**: 最低100回の反復実行を設定すること
- **Result型の使用**: UseCaseは例外を投げず、Result型で成功・失敗を表現すること
- **APIファサードの分割**: 3つのAPIファサード（IdeaCommandAPI、IdeaQueryAPI、IdeaAnalysisAPI）に責務を分割すること
- **Requestオブジェクトのバリデーション**: Requestオブジェクトはコンストラクタでバリデーションを実行すること
- **分析IDの明示的な扱い**: SuggestActionRequestはanalysisIdパラメータを持ち、提案の再現性を確保すること
- **コミュニケーション**: フェーズ2の開発者間で、共通部分（エラーハンドリング、ヘルパー関数など）について適宜コミュニケーションを取ること
- **統合前の確認**: フェーズ2完了時に、各開発者が自分の担当機能のユニットテスト・プロパティテストがすべて通過していることを確認すること

