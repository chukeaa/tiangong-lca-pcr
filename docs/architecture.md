---
title: PCR 资料库架构
docType: reference
scope: repo
status: draft
authoritative: true
owner: tiangong-lca-pcr
language: zh-CN
whenToUse:
  - 当变更 canonical PCR identity、分类来源处理、映射或模块时
  - 当判断某个分类体系应该创建 PCR 记录还是 mapping 记录时
whenToUpdate:
  - 当 PCR 目录结构变化时
  - 当分类导入或 mapping 架构变化时
  - 当 classification import 或 legacy scaffold 的治理规则变化时
  - 当公开 PCR 消费 CLI、Agent skill 或 feedback intake 架构变化时
checkPaths:
  - docs/architecture.md
  - AGENTS.md
  - README.md
  - .docpact/config.yaml
  - builder/**
  - packages/**
  - skills/**
  - .github/workflows/**
  - .github/ISSUE_TEMPLATE/**
  - classifications/**
  - library/modules/**
lastReviewedAt: 2026-09-13
lastReviewedCommit: da2301271085ca4db71804ea458d898deaa59cd5
---

# PCR 资料库架构

## 项目定位

本仓库是 TianGong LCA 的 PCR 方法学资料库。它负责存储 canonical PCR 内容，
并提供用于构建、校验、消费、预览和反馈 PCR 的工具链。

这个仓库同时服务两类使用者：

- 维护者和 AI production agent：创建、更新、审核、发布 PCR。
- 外部用户和 AI consumer agent：查找、解析、读取、验证、预览 PCR，并提交反馈。

架构文档的目标不是重复每个 CLI 的用法，而是说明：PCR truth 放在哪里、各层为什么存在、
跨层变更应该走哪条边界。

## 核心原则

- PCR 方法学 truth 存在 `library/pcrs/**`。
- 可复用方法规则存在 `library/modules/**`。
- 外部分类体系只是入口和索引，不拥有 PCR identity。
- methodology catalog 与 classification coverage 是两个读模型：前者默认只展示 material PCR，后者完整描述
  外部分类 leaf 当前是否存在 accepted mapping。
- `builder/` 负责构建、投影、校验和发布 PCR 内容。
- `packages/` 负责消费侧工具和运行时能力，不直接维护 PCR truth。
- `skills/` 只指导 agent 使用工具，不复制 PCR 方法学。
- feedback 是 candidate evidence，必须经过 maintainer intake 才能变成仓库变更。
- 生成物和派生物不能成为独立 truth source。

## 架构视图

```text
                         +----------------------+
                         | classifications/     |
                         | 外部分类 -> PCR id    |
                         +----------+-----------+
                                    |
                                    v
+-------------+        +------------+------------+        +---------------------+
| builder/    | -----> | library/                | -----> | packages/pcr-core/  |
| 构建与维护   |        | canonical PCR truth     |        | 共享只读消费核心       |
+------+------+        +------------+------------+        +----------+----------+
       |                            |                                |
       v                            v                                v
+------+-------+        +-----------+----------+          +----------+-----------+
| builder/docs |        | library/modules/     |          | CLI / viewer / skill |
| workflow     |        | shared method rules  |          | 面向用户和 agent       |
+--------------+        +----------------------+          +----------------------+

feedback -> issue template / feedback draft -> maintainer intake -> builder workflow -> library
```

读这个图时要注意三点：

- `builder/` 是写入侧，负责把维护者或 AI production agent 的工作落到 `library/`。
- `packages/pcr-core/` 是读取侧核心，负责把 `library/` 和 `classifications/` 变成稳定消费 API。
- CLI、viewer、skill 都是消费界面；它们不能绕过 `pcr-core` 自己发明一套 PCR 读取和投影规则。

## 组件职责

| 组件 | 职责 | 可以写什么 | 不能做什么 |
| --- | --- | --- | --- |
| `builder/` | PCR 构建、投影、lint、lifecycle、publish 工具层 | 通过 workflow 写入 `library/pcrs/**`、生成 `structured.yaml`、维护 builder schema/template/vocab | 不存储独立 PCR truth |
| `library/` | canonical PCR 内容和可复用方法规则 | `library/pcrs/**`、`library/modules/**`、必要索引 | 不放 CLI runtime、viewer UI 或 agent skill 行为 |
| `classifications/` | 外部分类体系 source、accepted mapping、retired-id alias 和派生 coverage | `classifications/systems/**`、`classifications/mappings/**`、`classifications/aliases/**`、`classifications/indexes/**` | 不定义 PCR 目录结构，不用外部 code 充当 PCR identity |
| `packages/pcr-core/` | 共享只读消费核心 | catalog read、classification resolve、Markdown read、guidance projection、validation、feedback draft | 不直接修改 PCR 文件 |
| `packages/tiangong-pcr-cli/` | 外部用户和 AI agent 的命令行入口 | CLI command、help、output formatting、exit behavior | 不复制 `pcr-core` 的 library traversal 规则，不修改 PCR truth |
| `packages/pcr-viewer/` | 本地静态预览界面 | viewer build、static UI、local server | 不成为 PCR editor，不成为另一套 PCR database |
| `skills/tiangong-pcr/` | 指导外部 AI agent 使用 PCR CLI 和反馈流程 | 使用流程、CLI 指南、agent checklist | 不复制 PCR 方法学细节 |
| `.github/ISSUE_TEMPLATE/` | 结构化反馈入口 | missing PCR、mapping gap、UUID issue、range evidence、translation 等反馈模板 | 不直接改变 canonical PCR |
| `docs/` | repo 级架构、政策、authoring、release、coding 指南 | 稳定说明和跨层规则 | 不承载 builder 细节 workflow；细节放 `builder/docs/` |

## 核心数据模型

### PCR Record

一个 material PCR 是一个目录，而不是一个单文件，也不是一个外部分类 code。

```text
library/pcrs/<domain>/<subdomain>/<pcr-slug>/
  manifest.yaml      # identity / lifecycle / language-independent metadata
  pcr.en-US.md       # English human-readable methodology
  pcr.zh-CN.md       # Chinese human-readable methodology
  structured.yaml    # machine-facing projection for tools
```

首次发布后，同一个 canonical leaf 会扩展出受管理的发布状态：

```text
  release-history.yaml
  revision/                         # 只在一个 revision 打开期间存在
    revision.yaml                   # base/target version 与打开时间
    manifest.next.yaml
    pcr.en-US.md
    pcr.zh-CN.md
    structured.yaml
  releases/<semver>/
    release.yaml
    manifest.snapshot.yaml
    pcr.en-US.md
    pcr.zh-CN.md
    structured.yaml
```

发布后的 top-level 四文件始终是 consumer-facing current release。`revision/` 是显式写入 workspace，
不会提前替换 current；`releases/<semver>/` 是不可变审计快照，`release-history.yaml` 是 append-only
predecessor chain。受管理子树使用 `manifest.next.yaml` / `manifest.snapshot.yaml`，不得嵌套另一个
`manifest.yaml`，从而不会被 catalog 当成新的 canonical identity。

文件职责：

- `manifest.yaml`：PCR id、title map、status、version、content maturity、translation state、target entities、module references、classification references。
- `pcr.en-US.md` / `pcr.zh-CN.md`：同一 PCR 方法学的双语人类可读文本。
- `structured.yaml`：供工具消费的结构化投影，包含 reference flow、boundary abstraction、measurement rules、process map、process inventory、dataset production requirements、validation rules、published dataset profile、data sources，以及可验证 source 与 generated content 的 projection metadata。
- `revision.yaml`：开放 revision 的 workflow metadata，锁定 base version 和 target version；它不是 lifecycle truth。
- `release.yaml` / `release-history.yaml`：记录 exact-byte SHA-256、发布时间、前驱版本和 snapshot path；lint 校验版本唯一性、前驱链、快照完整性与 current/latest 一致性。

### 契约执行层

仓库只对稳定、需要机器判断的边界使用严格 JSON Schema 2020-12；Markdown 仍是允许
方法学表达的 canonical authoring truth。Schema 校验不会执行类型强制转换、默认值填充或
删除未知字段，因此不会在校验过程中暗中改写输入。

写入侧由 builder lint 执行 catalog、classification mapping、retired-id alias、PCR manifest、双语 Markdown frontmatter
与 material structured projection 契约。结构化投影 Schema 位于
`packages/pcr-core/schemas/structured-projection.schema.json`，builder 与消费侧共用同一份定义。

JSON Schema 负责稳定机器形状；随 material 状态变化的内容完整度由独立语义门禁负责。builder
preflight 与 `packages/pcr-core` 共同要求 identity、functional unit、reference flow、measurement、
boundary、inventory、allocation、validation 和 published profile 具备可消费内容。

消费侧由 `packages/pcr-core` 在运行时再次校验 material projection Schema、指纹与内容完整度，并在
返回 readiness、guidance、validation report 和 feedback draft 前执行各自的输出 Schema。readiness 与
validation report 还执行 JSON Schema 不适合表达的跨字段语义校验，例如 blocker/usability 对齐、
finding 汇总、coverage 算术、completeness 和 status 一致性。这个重复是信任边界：repo lint 保护
入库内容，运行时校验保护当前被读取的文件和公开输出。

发布状态还有三个独立 executable Schema：`pcr-revision.schema.json`、`pcr-release.schema.json` 和
`pcr-release-history.schema.json`。builder lint 在 Schema 之外验证 exact file set、SemVer 单调增长、
predecessor chain、snapshot byte hash、projection 完整性，以及 top-level current 与 latest release 的一致性。
current published manifest 的 `release_artifacts` 固定双语 Markdown 和 `structured.yaml` 的 exact-byte
SHA-256；消费侧读取已发布/弃用记录时重新读取 manifest 并核对这些 digest，避免把并发替换或篡改后
的混合文件当成同一份 release。

### Classification Mapping

classification mapping 把外部分类 code 映射到 canonical PCR id。

```text
classifications/systems/<system>/<version>/      # source / normalized classification data
classifications/mappings/<system>-<version>-to-pcr.yaml
classifications/aliases/pcr-id-aliases.yaml
classifications/indexes/<system>-<version>-coverage.json
```

同一个 PCR 可以被多个外部分类体系或多个分类 leaf 映射。新增分类体系首先新增 source、normalized data
和已注册的 coverage descriptor；只有确认 reviewed semantic match 后才新增 mapping，不复制 PCR 目录树，
也不为每个 leaf 预造 edge。

Current mapping 使用 `schema_version: 2` / `status: current`，只保存已接受的 positive edge。每条 edge
必须指向 material PCR，relation 只能是 `exact`、`broader`、`narrower` 或 `proxy`，并携带
`acceptance.status`、`decided_by`、`decided_at_utc` 和 durable `decision_ref`。Candidate suggestion 和
`manual_review` 是 coverage assessment，不进入 positive mapping。CPC 3.0 当前只有 `01111`、`04412`、
`04911` 三条 accepted edge；CPC 2.1 是零 edge 的 current v2 mapping。

Mapping 文件表达 classification-to-PCR accepted edge 输入；coverage index 则是由 normalized leaf、mapping
和 PCR lifecycle state 确定性生成的 read model。其 source descriptor 固定生成契约，以及两份输入的
exact-byte SHA-256；读取时输入路径或字节不一致都会 fail closed。Mapped entry 同时投影 acceptance
evidence，runtime resolve 会与 canonical mapping 再次比对。Coverage index 不是新的 authoring truth，
不能手工替代 mapping。CPC 3.0 read model 仍完整覆盖 2,877 leaf：3 mapped、2,874 unmapped、0 unknown。
已知 leaf 可以合法地处于 `unmapped`、`candidate_suggestion` 或 `manual_review`，此时不得为了让覆盖率
看起来完整而自动创建 PCR id。Coverage index 缺失时 resolve 直接 fail closed，不得退回只读 mapping
并自动选择 PCR。

`catalog:build` 先校验 mapping、alias、manifest、material index 和 coverage 的完整生成结果，再通过
`library/.pcr-builder-state/catalog/` 下的 lock、journal、stage 和 backup 发布 catalog/material/coverage
artifact set。目标路径、symlink、baseline、staged bytes 和 transaction ownership 都会重新验证；commit
前中断恢复为整组旧版本，commit 后中断向前完成 cleanup。`catalog:check` 只读校验 exact generated bytes，
存在未恢复 transaction state 时 fail closed。使用 `catalog:recover` 显式恢复；只有确认没有 writer 且普通
恢复明确要求时，才使用 `--force-stale-lock`。这是跨目录的 crash-recoverable whole-set transaction，
不宣称 filesystem-level instantaneous atomic exchange。

`classifications/aliases/pcr-id-aliases.yaml` 是从 retained CPC leaf identity inventory 与 accepted mapping
确定性生成的 retired-id registry。当前 2,874 条 alias 都是 terminal `classification_coverage` locator；
source 唯一，不得与 material id 冲突，不得成链或成环。Alias lookup 优先于 catalog lookup，即使物理
scaffold 仍存在也返回 redirect；locator 不会被自动 follow 成 PCR。Catalog 以 canonical path、exact-byte
SHA-256 和 entry count 绑定 registry，缺失、截断或字节漂移必须在运行时 fail closed。

Canonical `import-cpc` 每次都要求显式 `--source`，默认只写
raw source、source metadata、normalized artifacts 和必要的 zero-edge mapping，创建 0 个 PCR；
classification-only import 会先校验并逐字节保留既有 mapping，非 3.0 版本必须先注册 coverage
descriptor。Importer 对每个 CPC system/version coordinate 加锁，以 no-follow 方式读取 managed input，
在提交前检查 baseline 未变化，并从 staging 安装整组输出；mapping 最后提交，因此失败不能留下 dangling
new edge。

`scaffold-cpc` 是受保护的 compatibility alias，只有显式 `--legacy-scaffolds` 才能用于 retained v1 fixture
的迁移复现或测试，不能用于新 import。遇到 current v2 mapping 时它在 mutation 前 fail closed，因此
不能注入 unaccepted edge，也不能重新生成已退役目录。在 v1 fixture 中，目标缺失时可创建完整四文件
legacy scaffold；目标已存在时必须与确定性 legacy template 逐字节一致，不得补齐 partial directory、
覆盖 accepted edge 或改写 PCR。

Phase 2 的 importer cutover、edge acceptance、positive mapping 收缩、alias registry 和 old-id redirect
已完成。Phase 3 只完成一个物理 pilot：删除 CPC `99000` 的四文件目录；它现在是 known-unmapped，旧 id
返回 coverage redirect。仓库现有 2,876 个 PCR 目录，其中 3 个 material、2,873 个 legacy scaffold。
CPC `98000` 与后续批量物理迁移仍待执行。

### Module

`library/modules/**` 保存多个 PCR 可复用的方法规则，例如 reference flow、system boundary、
allocation、data quality 和 validation 规则。模块是方法学资产，不是消费工具。

### Guidance Output

`packages/pcr-core` 从 `structured.yaml` 构造 Agent-facing guidance。这个 guidance 是消费视图，
不是新的 authoring truth。CLI、viewer 和 skill 都应把它当作读取结果，而不是修改源。

每个 material catalog record、mapped resolve 和 guidance 结果都携带 `readiness`：

- `ready`：方法学已经审核，可进入 guidance 和 validation。
- `review_required`：已有 authored methodology，可以带显式审核警告使用。
- `unavailable`：例如 `empty_scaffold`、deprecated PCR 或缺少结构化投影，不得进入 guidance 或 validation。

classification mapping 只回答“哪个 accepted PCR id 对应这个外部 code”，不回答“该 PCR 是否已可用”。
消费方必须检查 `resolution_status`、`coverage_status`，并且只在 `pcr` 存在时继续检查
`usable_for_guidance` 或 `usable_for_validation`。已知但未映射的 leaf 是正常成功结果：
`mapping: null`、`pcr: null`。旧 leaf-derived PCR id 通过 `resolve --pcr` 返回
`legacy_id_redirect`、terminal locator 与 copyable next command，不自动选择目标；内容命令返回稳定
`PCR_LEGACY_ID_REDIRECT`，不是普通 not-found，也不是可用方法学。

对 material PCR，readiness 还携带 `projection_fingerprint`。`pcr-core` 在计算当前 readiness 时校验
structured projection Schema，然后重新计算 canonical Markdown 与 generated content 的 SHA-256，而不是
只检查 `structured.yaml` 是否存在。指纹对文本先移除开头 UTF-8 BOM，再将 CRLF 和单独 CR
统一为 LF；确定性元数据不包含时间戳。Schema 失败、metadata 缺失、不支持的 contract
version、source mismatch 或 content mismatch 都会成为 blocker。对 empty scaffold，该指纹明确为
`not_required`。即使指纹 current 且 Schema-valid，缺少上述 material 方法学内容仍会成为独立
readiness blocker，不能仅靠 `authored_methodology` 标签进入 guidance。

guidance 会投出 `system_boundary.rules`、`allocation_rules` 和 `validation_rules` 等关键规则。
validation report 同时声明 `validation_status`、`completeness`、输入接受状态、已执行检查和跳过检查；
因此“没有 finding”不能在 coverage 不完整时被解释为完整符合。

### Feedback Draft

feedback draft 和 GitHub issue 是候选证据。它们可能指向 PCR 内容、mapping、UUID、range、
source、translation 或 validator 问题，但必须经过 maintainer intake 和 builder workflow
才能改变仓库 truth。

反馈输入与 issue-ready draft 是两个不同实体：`feedback.schema.json` 描述结构化 intake，
`feedback-draft-output.schema.json` 描述 CLI 返回的 `{ title, body }`。不要用一个 Schema 同时表示
尚未渲染的反馈字段和已经渲染的 issue 文本。

## 关键流程

### 创建或更新 PCR

```text
builder/AGENTS.md + builder/docs/index.md
  -> 选择 create/update/translate/review/publish workflow
  -> unpublished: 编写 top-level pcr.*.md
  -> published: pcr:revise --version <target> 后只编写 revision/pcr.*.md
  -> npm run pcr:sync-structured -- --pcr <library/pcrs/...> --workspace <current|revision>
  -> npm run validate
  -> lifecycle / bump(unpublished current only) / publish when applicable
```

PCR production 可以使用公共证据和领域常识初始化候选过程结构，但最终 UUID 和关键定量规则
必须来自 Tiangong lookup 或可引用 evidence。lookup trace、session path、API key 和 access
token 不进入 PCR 内容。

首次发布使用 `pcr:publish --workspace current --version <semver>`，同时生成 top-level current、初始
release snapshot 与 history。后续版本使用 `pcr:publish --workspace revision`，target version 取自
`revision.yaml`，不能在发布时改写。发布成功后 revision 被提升并移除；发布期间 current 始终是上一个
稳定 release。已 published 的 current 不允许原地 sync 或 bump，只允许一次性 lifecycle transition 到
`deprecated/deprecated_methodology`；deprecated 不能 reopen。

sync、bump、lifecycle、revise 和 publish 使用 whole-directory recoverable transaction。完整 PCR leaf 先
复制到 staging 并校验，lock、journal、backup 与 old/new tree digest 存在
`library/.pcr-builder-state/`，再通过同文件系统 rename 安装。它是可恢复的目录替换，不宣称 atomic
directory exchange。中断发生在 commit 前会回滚，已经 committed 但 cleanup 未完成则 forward finish；
使用 `pcr:recover` 显式恢复，只有确认没有 active writer 且普通恢复要求时才使用
`--force-stale-lock`。

### 外部分类 code 解析到 PCR

```text
classification code
  -> classifications/indexes/<system>-<version>-coverage.json
  -> accepted classifications/mappings edge or known-unmapped result
  -> canonical PCR id only for an accepted material mapping
  -> packages/pcr-core
  -> tiangong-pcr resolve / viewer search / agent guidance
```

外部分类 code 是入口，不是 PCR identity。如果两个分类 leaf 指向相同方法学品类，应映射到
同一个 PCR id。

### 外部用户或 AI agent 消费 PCR

```text
agent / user
  -> skills/tiangong-pcr or README
  -> npm --silent run tiangong-pcr -- <command>
  -> packages/tiangong-pcr-cli
  -> packages/pcr-core
  -> library + classifications
```

公开 CLI 提供 material-first catalog browsing、classification coverage、classification resolution、PCR display、guidance output、
model validation、dataset validation 和 feedback draft。它是消费契约，不是 authoring 入口。

`tree` 和 `list` 默认只读取 material PCR，并支持显式 `--scope material|legacy|all`。`tree` 默认返回
depth 2 的 domain/subdomain 范围；Agent 应使用分页 `list --path-prefix <domain/subdomain>` 下钻。
list JSON 显式返回 filters、effective scope、has_more 和可复制的 next/previous command，tree JSON
显式返回 scope、depth 和 completeness。命令各自声明允许的输出格式，不允许 `show --format json` 或
`guidance --format markdown` 这类格式与实际内容不一致的成功结果。

`coverage summary --classification cpc:3.0` 提供有界汇总；`coverage list --classification cpc:3.0`
按页返回 leaf，默认每页 10 条，并可按 coverage status 过滤。它们不做 fuzzy search，也不会把 candidate
suggestion 自动升级为 mapping。`resolve` 必须且只能传 `--classification` 或 `--pcr` 之一：前者对
accepted mapping 返回 material PCR，对已知 unmapped leaf 成功返回空 mapping/PCR；后者对 current id
返回 canonical record，对 retired id 返回不自动 follow 的 alias locator。只有 mapped/canonical PCR 才继续
检查 readiness；retired id 的 `guidance` 和 validation 会以稳定 redirect error 失败。validation 命令默认
在 error finding 或结果 inconclusive 时退出 2；仅报告但不影响 shell 状态的工作流必须显式使用
`--fail-on never`。

当请求 JSON 时，usage/input/runtime error 保持 stdout 为空，在 stderr 返回稳定 error code、
message、details 和 exit_code；validation gate 的 exit 2 仍把完整 validation report 放在 stdout。

### 本地 viewer 预览 PCR

```text
npm run viewer:build
  -> packages/pcr-core reads library + classifications
  -> packages/pcr-viewer/dist/data/pcr-viewer-data.json
  -> npm run viewer:serve
  -> local static browser viewer
```

viewer 是只读预览界面。它可以帮助浏览、搜索和检查 Markdown/guidance/source，但不能编辑 PCR。
viewer build 默认 scope 是 `material`；只有显式传入 `--scope legacy` 或 `--scope all` 才包含迁移期
兼容记录。Classification coverage 作为独立 read model 展示，不把 legacy scaffold 重新包装成方法学。
构建器先在同级临时目录准备完整输出，再替换目标。自定义非空目录只有带有 viewer build marker
时才允许替换；仓库根、package source 和其他受保护路径会在 realpath 解析后被拒绝。local server
同样会解析请求文件的真实路径，并拒绝通过 symlink 跳出 build root 的访问。
缺失或空的 PCR catalog 会在替换开始前失败，不能用空站点覆盖上一次可用 build。

### feedback 回流

```text
user / agent finding
  -> tiangong-pcr feedback draft or GitHub issue template
  -> maintainer intake
  -> builder update workflow
  -> library/pcrs/** or classifications/mappings/**
```

feedback 可以触发 PCR 内容更新、mapping 修复、UUID 修正、range evidence 更新、translation
修正、source 更新、validator 调整或 CLI 行为修复。feedback 本身不是 truth。

## Source of Truth 与派生物

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| PCR 方法学 truth | `library/pcrs/**` | canonical PCR 内容 |
| PCR 发布审计链 | `library/pcrs/**/releases/**`、`release-history.yaml` | immutable snapshots 与 append-only release lineage |
| 可复用方法 truth | `library/modules/**` | 多个 PCR 共享的方法规则 |
| 外部分类 truth | `classifications/systems/**` | 分类体系 source 和 normalized 数据 |
| mapping truth | `classifications/mappings/**` | 外部分类 code 到 material PCR id 的 accepted positive edge 与 decision evidence |
| retired-id locator contract | `classifications/aliases/pcr-id-aliases.yaml` | 旧 leaf-derived PCR id 到 terminal coverage/canonical locator；不得自动 follow |
| authoring behavior | `builder/**` | 构建、投影、lint、publish 行为 |
| controlled token truth | `builder/vocab/*.yaml` | 稳定 machine token 的唯一手写来源 |
| consumption behavior | `packages/**`、`skills/**` | 读取、验证、展示和 agent 使用方式 |
| feedback intake | `.github/ISSUE_TEMPLATE/**`、`tiangong-pcr feedback draft` | 候选证据入口 |

派生物：

- `structured.yaml`：canonical PCR 内容的确定性机器侧投影；material PCR 的 repo lint 会验证共享 Schema、source/content 指纹，并逐字比较重新生成结果以拒绝 stale artifact。
- `packages/pcr-core/src/generated/controlled-vocabulary.mjs` 与 `packages/pcr-core/schemas/controlled-vocabulary.schema.json`：由 `builder/vocab/*.yaml` 确定性生成的 runtime/Schema 投影；`npm run vocab:check` 拒绝 stale artifact。
- `library/indexes/**`：用于浏览和检索的索引。
- `classifications/indexes/**`：由 normalized classification leaf、accepted mapping 与 material target state 生成的完整 coverage read model。
- `classifications/aliases/pcr-id-aliases.yaml`：由 CPC leaf identity inventory 与 accepted mapping 确定性生成；`npm run aliases:check` 拒绝 stale artifact。
- `packages/pcr-viewer/dist/**`：由 `npm run viewer:build` 生成的静态 viewer artifact。
- `classifications/systems/<system>/<version>/normalized/**`：由 retained source artifact 和 import logic 派生的 normalized 分类数据。

派生物必须能从其 source input 和工具重新生成。派生物不能成为独立方法学 truth。

## 变更入口指南

| 你要做什么 | 应该改哪里 |
| --- | --- |
| 新建或实质更新一个 PCR | `library/pcrs/**`，并走 `builder/docs/workflows/**` |
| 同步 unpublished current Markdown | `npm run pcr:sync-structured -- --pcr <library/pcrs/...> --workspace current` |
| 修订 published PCR | `pcr:revise --version <target-semver>`，然后只操作 `--workspace revision` |
| 同步 revision Markdown | `npm run pcr:sync-structured -- --pcr <library/pcrs/...> --workspace revision` |
| 调整 lifecycle / version / publish 状态 | 通过 `pcr:lifecycle`、unpublished-only `pcr:bump`、`pcr:publish` |
| 恢复中断的 builder directory transaction | `npm run pcr:recover -- --pcr <library/pcrs/...>` |
| 重建或校验 retired-id alias registry | `npm run aliases:build` / `npm run aliases:check` |
| 重建、校验或恢复 catalog artifact set | `npm run catalog:build` / `npm run catalog:check` / `npm run catalog:recover` |
| 新增或修复分类映射 | `classifications/mappings/**` |
| 新增 CPC source | 先注册所需 coverage descriptor，再通过 `pcr:import:cpc -- --source <csv>` 写 `classifications/systems/**`；只有 reviewed edge 才改 mapping |
| 修改 PCR 构建、lint 或 projection 规则 | `builder/lib/**`、`builder/schemas/**`、`builder/vocab/**` |
| 修改公开消费核心 API | `packages/pcr-core/**` |
| 修改 CLI 命令或输出 | `packages/tiangong-pcr-cli/**` |
| 修改 viewer UI 或本地预览能力 | `packages/pcr-viewer/**` |
| 修改 agent 使用说明 | `skills/tiangong-pcr/**` |
| 修改反馈入口 | `.github/ISSUE_TEMPLATE/**` 或 `packages/pcr-core` feedback draft |
| 修改 repo 级规则或说明 | `AGENTS.md`、`README.md`、`docs/**`、`.docpact/config.yaml` |

## 禁止跨层行为

- 不要让 classification code 成为 PCR directory slug。
- 不要因为新增分类体系而复制 PCR 记录。
- 不要让 CLI、viewer 或 skill 直接修改 `library/pcrs/**`。
- 不要让 viewer 绕过 `packages/pcr-core` 自己解析 PCR truth。
- 不要在 skill 中复制详细 PCR 方法学规则；skill 应指向 CLI 和 contracts。
- 不要把 feedback 当作已验证 truth；它必须经过 maintainer intake。
- 不要原地编辑、sync 或 bump published/deprecated current，也不要手工修改 `releases/**` 或 `release-history.yaml`。
- 不要 reopen deprecated PCR；successor/restoration 需要独立治理流程。
- 不要把 lookup trace、命令历史、session path、API key、access token 写入 PCR 文件。
- 不要把 `packages/pcr-viewer/dist/**` 当作源文件维护；它是 build artifact。

## 治理边界

迁移期剩余的 2,873 个 leaf PCR scaffold 仍可保持空状态，但它们不进入默认 material catalog。Governance 和
docpact 检查覆盖 builder assets、mappings、coverage indexes、modules、package surfaces、skills、feedback
intake 和 project contracts；大型 legacy 目录 `library/pcrs/**` 在 PCR 文件成为 material authored
records 前仍保持排除。Phase 2 的 importer cutover、edge acceptance、positive mapping 收缩、alias
registry 和 old-id redirect 已实现。Current v2 mapping 会阻止 `--legacy-scaffolds` rehydrate 已退役目录。
Phase 3 只完成 CPC `99000` pilot，CPC `98000` 和剩余 bulk physical migration 尚未完成。

material PCR 的状态、成熟度和翻译状态必须满足 lifecycle 矩阵。进入 `active` 前会运行实质
preflight；`publish` 只接受已 active、reviewed methodology、中文翻译已 reviewed、合法 semver、
且没有 unresolved/blocking review metadata 的记录。发布前先在内存中验证未来 manifest 与新投影的
Schema、指纹和语义 preflight，
失败不改文件；成功通过 recoverable whole-directory transaction 一起安装 current、snapshot 和 history。
首次发布从 current workspace 建立 release chain，后续发布只能从 target version 已锁定的 revision
workspace 追加 release。lint 同时检查 revision/release/history Schema、不可变 artifact digest、版本链与
current/latest 一致性。

pull request 和 main 分支 push 通过 GitHub Actions 运行 `npm run validate`，使本地合同、投影
freshness 和自动测试成为合并门禁的统一入口。
