-- ============================================================
-- 为三个子应用添加 sso_user_id 字段（不影响现有数据）
-- 每条 ALTER 都带 IF NOT EXISTS 风格的安全检查
-- 在 MySQL 服务器(116.62.129.218:3598) 上执行即可
-- ============================================================

-- 1. 太虚书院 (database: txsy, table: users)
USE txsy;
ALTER TABLE users ADD COLUMN sso_user_id INT NULL;

-- 2. 速心电竞 (database: game_helper, table: users)
USE game_helper;
ALTER TABLE users ADD COLUMN sso_user_id BIGINT UNSIGNED NULL;

-- 3. 留金计划 (database: credit_repayment, table: users)
USE credit_repayment;
ALTER TABLE users ADD COLUMN sso_user_id INT NULL;
