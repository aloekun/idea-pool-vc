# 要件定義書

## はじめに

このCLIツールは、ソフトウェアアイデアを永続的に蓄積し、LLMによる自動タグ付け・分類・評価を行い、「今このアイデアに対して、どんな進め方が現実的か」を提案として返すツールです。正解を出すのではなく、思考を前に進める補助輪として機能します。

## 用語集

- **System**: アイデア分類CLIシステム全体
- **Idea**: ユーザーが入力したソフトウェアアイデア
- **Chunk**: アイデアに追記される個別のテキスト単位
- **Tag**: アイデアの性質や特徴を表すラベル
- **Analysis**: LLMによるアイデアの分析結果
- **Suggestion**: アイデアに対する行動指針の提案
- **Local_DB**: ローカルに保存されるデータベース

## 要件

### 要件1: アイデアの初回登録

**ユーザーストーリー:** ユーザーとして、考えたソフトウェアアイデアを素早く登録したい。そうすることで、思考を記録し後から振り返ることができる。

#### 受入基準

1. WHEN ユーザーが1行のテキストでアイデアを入力する THEN THE System SHALL 新しいアイデアをLocal_DBに保存する
2. WHEN アイデアが保存される THEN THE System SHALL 一意のIDをアイデアに割り当てる
3. WHEN アイデアが保存される THEN THE System SHALL 登録日時を記録する
4. WHEN ユーザーが空のテキストでアイデアを登録しようとする THEN THE System SHALL エラーメッセージを表示し登録を拒否する

### 要件2: アイデアへの追記

**ユーザーストーリー:** ユーザーとして、既存のアイデアに追記したい。そうすることで、思考の成長過程を保持しながらアイデアを育てることができる。

#### 受入基準

1. WHEN ユーザーがアイデアIDを指定して追記テキストを入力する THEN THE System SHALL 新しいChunkとして追記内容を保存する
2. WHEN Chunkが保存される THEN THE System SHALL 追記日時を記録する
3. WHEN Chunkが保存される THEN THE System SHALL 元のアイデア本文を上書きしない
4. WHEN 存在しないアイデアIDに追記しようとする THEN THE System SHALL エラーメッセージを表示し追記を拒否する
5. WHEN ユーザーが空のテキストで追記しようとする THEN THE System SHALL エラーメッセージを表示し追記を拒否する

### 要件3: アイデアの一覧表示

**ユーザーストーリー:** ユーザーとして、登録したアイデアの一覧を見たい。そうすることで、過去のアイデアを確認し選択することができる。

#### 受入基準

1. WHEN ユーザーが一覧表示を要求する THEN THE System SHALL すべてのアイデアのID、登録日時、本文の要約を表示する
2. WHEN アイデアが1つも登録されていない THEN THE System SHALL 適切なメッセージを表示する
3. WHEN 一覧表示される THEN THE System SHALL アイデアを登録日時の降順で表示する

### 要件4: アイデアの詳細表示

**ユーザーストーリー:** ユーザーとして、特定のアイデアの詳細を見たい。そうすることで、アイデアの全内容と追記履歴を確認できる。

#### 受入基準

1. WHEN ユーザーがアイデアIDを指定して詳細表示を要求する THEN THE System SHALL アイデアの本文、すべてのChunk、タグ、分析結果を表示する
2. WHEN 各Chunkが表示される THEN THE System SHALL 追記日時とともに表示する
3. WHEN 存在しないアイデアIDを指定する THEN THE System SHALL エラーメッセージを表示する

### 要件5: LLMによるタグ生成

**ユーザーストーリー:** ユーザーとして、アイデアに自動的にタグを付けてほしい。そうすることで、アイデアの性質を素早く把握できる。

#### 受入基準

1. WHEN ユーザーがアイデアの分析を要求する THEN THE System SHALL LLMにアイデア内容を送信する
2. WHEN LLMがタグ候補を生成する THEN THE System SHALL タグ候補をLocal_DBに保存する
3. WHEN タグが生成される THEN THE System SHALL 性質、規模感、技術難易度、開発フェーズ、リスク、領域のカテゴリを含む
4. WHEN タグが保存される THEN THE System SHALL 生成日時を記録する
5. WHEN LLMとの通信に失敗する THEN THE System SHALL エラーメッセージを表示し処理を中断する

### 要件6: タグの手動編集

**ユーザーストーリー:** ユーザーとして、自動生成されたタグを編集したい。そうすることで、自分の判断でタグを調整できる。

#### 受入基準

1. WHEN ユーザーがアイデアIDとタグを指定してタグ追加を要求する THEN THE System SHALL 新しいタグをアイデアに追加する
2. WHEN ユーザーがアイデアIDとタグを指定してタグ削除を要求する THEN THE System SHALL 指定されたタグをアイデアから削除する
3. WHEN 存在しないアイデアIDを指定する THEN THE System SHALL エラーメッセージを表示する

### 要件7: LLMによる行動指針の提案

**ユーザーストーリー:** ユーザーとして、アイデアに対する次のステップの提案が欲しい。そうすることで、思考を前に進めることができる。

#### 受入基準

1. WHEN ユーザーがアイデアの提案を要求する THEN THE System SHALL LLMにアイデア内容とタグを送信する
2. WHEN LLMが行動指針を生成する THEN THE System SHALL 提案内容をLocal_DBに保存する
3. WHEN 提案が生成される THEN THE System SHALL 提案ベースの柔らかい表現を使用する
4. WHEN 提案が生成される THEN THE System SHALL 断定的な命令形を使用しない
5. WHEN 提案が保存される THEN THE System SHALL 生成日時を記録する

### 要件8: 分析履歴の保持

**ユーザーストーリー:** ユーザーとして、過去の分析結果を保持したい。そうすることで、時間経過による思考の変化を振り返ることができる。

#### 受入基準

1. WHEN 同じアイデアに対して再度分析を実行する THEN THE System SHALL 新しい分析結果を追加する
2. WHEN 新しい分析結果が保存される THEN THE System SHALL 過去の分析結果を上書きしない
3. WHEN 分析結果が表示される THEN THE System SHALL すべての分析履歴を時系列で表示する

### 要件9: データの永続化

**ユーザーストーリー:** ユーザーとして、入力したデータが永続的に保存されることを期待する。そうすることで、データの損失を防ぐことができる。

#### 受入基準

1. WHEN アイデアが登録される THEN THE System SHALL データをLocal_DBに即座に保存する
2. WHEN Chunkが追加される THEN THE System SHALL データをLocal_DBに即座に保存する
3. WHEN タグが変更される THEN THE System SHALL データをLocal_DBに即座に保存する
4. WHEN 分析結果が生成される THEN THE System SHALL データをLocal_DBに即座に保存する
5. THE System SHALL 一時メモリのみにデータを保持しない

### 要件10: コマンドラインインターフェース

**ユーザーストーリー:** ユーザーとして、シンプルなコマンドでツールを操作したい。そうすることで、素早く効率的にアイデアを管理できる。

#### 受入基準

1. THE System SHALL `idea add <text>` コマンドでアイデアを登録する機能を提供する
2. THE System SHALL `idea append <id>` コマンドでアイデアに追記する機能を提供する
3. THE System SHALL `idea list` コマンドでアイデア一覧を表示する機能を提供する
4. THE System SHALL `idea show <id>` コマンドでアイデア詳細を表示する機能を提供する
5. THE System SHALL `idea analyze <id>` コマンドでアイデアを分析する機能を提供する
6. THE System SHALL `idea suggest <id>` コマンドで行動指針を提案する機能を提供する
7. WHEN 不正なコマンドが入力される THEN THE System SHALL ヘルプメッセージを表示する
