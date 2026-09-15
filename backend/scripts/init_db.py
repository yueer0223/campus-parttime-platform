"""初始化数据库：建表并写入种子数据。

用法（在 backend 目录下）：
    ./.venv/bin/python scripts/init_db.py [--reset]
"""
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants import PriceType, TaskStatus
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import Category, Task, User


CATEGORY_NAMES = [
    "家教辅导", "促销导购", "发单地推", "校园代理", "餐饮服务",
    "文员助理", "客服话务", "翻译口译", "设计制作", "摄影摄像",
    "编程外包", "新媒体运营", "视频剪辑", "代取外卖", "代取快递",
    "代打印", "校园跑腿", "活动礼仪", "问卷调研", "图书管理", "其他",
]


# (标题, 描述, 分类, 报酬, 价格方式, 工作时长, 截止时间, 状态, 距今发布天数)
TASK_SAMPLES = [
    ("初二数学一对一辅导", "每周三、周日晚 7 点到 9 点，辅导初二男生数学，地点在图书馆南门自习区。要求讲解耐心，能把几何题讲透，最好有家教经验。", "家教辅导", 128, PriceType.FIXED, "2 小时/次", "本周内开始", TaskStatus.OPEN, 0),
    ("小学英语作业陪读", "周一到周五放学后陪读两小时，主要督促完成英语作业并纠正发音，孩子家住东门附近。", "家教辅导", 95.5, PriceType.FIXED, "2 小时/次", "长期", TaskStatus.IN_PROGRESS, 3),
    ("周末商场运动品牌促销", "周六周日两天，在万达广场一楼运动品牌专柜协助试穿引导，站班有提成，需穿统一工服。", "促销导购", 268, PriceType.FIXED, "8 小时/天", "本周末", TaskStatus.OPEN, 1),
    ("新店开业饮品试饮", "商圈新开奶茶店门口引导试饮，三天连做优先，表现好可谈长期兼职。", "促销导购", 152.5, PriceType.FIXED, "6 小时/天", "三天", TaskStatus.COMPLETED, 10),
    ("北门发课程传单", "中午 11 点半到 1 点、傍晚 5 点到 6 点半在校北门发单，按小时计费，能接受拍照打卡。", "发单地推", 73, PriceType.FIXED, "3 小时/天", "本周", TaskStatus.OPEN, 2),
    ("App 校园地推扫码", "在校内食堂门口引导下载注册，按有效注册量结算，提供培训话术。", "发单地推", 88.5, PriceType.FIXED, "4 小时/天", "一周", TaskStatus.CANCELLED, 8),
    ("驾校招生校园代理", "负责驾校在校园的宣传与意向登记，按报名人数阶梯提成，长期合作优先。", "校园代理", 315, PriceType.FIXED, "弹性", "长期", TaskStatus.OPEN, 0),
    ("考研资料校园推广", "向大三大四同学推广考研资料与课程，可线上可线下，按成单计酬。", "校园代理", 176, PriceType.NEGOTIABLE, "弹性", "长期", TaskStatus.OPEN, 5),
    ("奶茶店晚班店员", "每周三到周日 18 点到 22 点，负责点单与制作，提供培训，需健康证。", "餐饮服务", 108, PriceType.FIXED, "4 小时/班", "长期", TaskStatus.OPEN, 1),
    ("食堂窗口收银打饭", "午晚高峰在二食堂窗口收银，饭点管饭，要求手脚麻利。", "餐饮服务", 82, PriceType.FIXED, "3 小时/天", "长期", TaskStatus.IN_PROGRESS, 4),
    ("学院办公室档案整理", "协助学院办公室把纸质档案录入电子表格，约 400 份，按天结算，要求细心。", "文员助理", 68, PriceType.FIXED, "4 小时/天", "两周内", TaskStatus.OPEN, 3),
    ("企业问卷数据录入", "把 600 份纸质问卷录入系统，可远程完成，需自备电脑，按份计酬。", "文员助理", 122, PriceType.FIXED, "弹性", "一周内", TaskStatus.COMPLETED, 12),
    ("教育机构线上客服", "在线回复家长咨询并登记试听信息，排班灵活，能长期稳定在线者优先。", "客服话务", 76, PriceType.FIXED, "4 小时/班", "长期", TaskStatus.OPEN, 2),
    ("电话回访专员", "按名单回访学员并记录反馈，每天约 30 通，普通话标准、表达清晰。", "客服话务", 84, PriceType.FIXED, "3 小时/天", "一周", TaskStatus.OPEN, 6),
    ("英文课程资料翻译", "翻译一份英文课程讲义约 3800 词，需先通过 200 词试译，英译中。", "翻译口译", 136, PriceType.FIXED, "弹性", "三天内", TaskStatus.OPEN, 1),
    ("展会陪同口译", "陪同参展企业在展会进行商务沟通，要求英语口语流利，能处理专业术语。", "翻译口译", 245, PriceType.NEGOTIABLE, "全天", "展会期间", TaskStatus.OPEN, 7),
    ("社团文化节海报设计", "为社团文化节设计三张竖版海报，风格青春有活力，需提供源文件。", "设计制作", 95, PriceType.FIXED, "弹性", "五天内", TaskStatus.OPEN, 0),
    ("课程汇报 PPT 美化", "把一份 18 页课程汇报 PPT 重新排版，要求简洁专业，两天内交付。", "设计制作", 58, PriceType.FIXED, "弹性", "两天内", TaskStatus.COMPLETED, 11),
    ("毕业班跟拍半天", "为毕业班跟拍半天，需自带单反，交付 30 张精修加全部原片。", "摄影摄像", 158, PriceType.FIXED, "4 小时", "约定时间", TaskStatus.OPEN, 4),
    ("社团活动视频录制", "录制社团周年庆活动并做简单剪辑，时长约 3 分钟，可协商借用设备。", "摄影摄像", 128, PriceType.FIXED, "半天", "活动当天", TaskStatus.IN_PROGRESS, 5),
    ("校园二手交易小程序", "开发校园二手交易小程序前端，共 6 个页面，需求文档已备好，工期两周。", "编程外包", 320, PriceType.FIXED, "两周", "三周内", TaskStatus.OPEN, 2),
    ("公开数据采集脚本", "写一个公开网站数据采集脚本并导出 CSV，需遵守目标网站使用规范。", "编程外包", 268, PriceType.NEGOTIABLE, "弹性", "一周内", TaskStatus.OPEN, 8),
    ("校园公众号推文", "撰写两篇校园生活主题推文并排版，要求有网感、图文并茂。", "新媒体运营", 74, PriceType.FIXED, "弹性", "三天内", TaskStatus.OPEN, 3),
    ("小红书账号日常运营", "负责账号每周三篇笔记与评论互动，需熟悉校园种草内容。", "新媒体运营", 112, PriceType.FIXED, "每周 6 小时", "长期", TaskStatus.OPEN, 6),
    ("活动短视频剪辑", "把约 40 分钟活动素材剪成 1 分钟成片，需会剪映或 Premiere，两天内交。", "视频剪辑", 118, PriceType.FIXED, "弹性", "两天内", TaskStatus.OPEN, 1),
    ("课程视频字幕校对", "校对网课字幕错别字与时间轴，约 20 课时，按课时计酬。", "视频剪辑", 86, PriceType.FIXED, "弹性", "一周内", TaskStatus.COMPLETED, 13),
    ("代取外卖送到宿舍楼下", "中午和晚上帮同学代取校门口外卖并送到宿舍楼下，小单 3 元、大单 5 元。", "代取外卖", 5, PriceType.FIXED, "单次约 15 分钟", "长期", TaskStatus.OPEN, 0),
    ("代取快递送到宿舍", "在菜鸟驿站代取快递并送到对应宿舍楼下，小件 2 元大件 4 元，熟悉宿舍区路线。", "代取快递", 4, PriceType.FIXED, "单次约 15 分钟", "长期", TaskStatus.OPEN, 1),
    ("帮打印材料送教室", "帮同学在打印店打印并送到指定教室，按页数加小费，顺路可接。", "代打印", 5, PriceType.FIXED, "单次约 20 分钟", "长期", TaskStatus.OPEN, 2),
    ("校园跑腿代购", "帮同学代购食堂、超市物品并送到宿舍，按单计酬，晚自习后可接。", "校园跑腿", 52, PriceType.FIXED, "单次约 30 分钟", "长期", TaskStatus.OPEN, 2),
    ("迎新晚会礼仪", "担任晚会迎宾与颁奖礼仪，要求形象气质佳，提供服装与化妆。", "活动礼仪", 148, PriceType.FIXED, "3 小时", "晚会当天", TaskStatus.OPEN, 5),
    ("招聘会现场引导", "校园招聘会现场负责签到、引导与秩序维护，早 8 点到下午 2 点。", "活动礼仪", 110, PriceType.FIXED, "6 小时", "招聘会当天", TaskStatus.OPEN, 9),
    ("商圈问卷调研", "在商圈做线下问卷，按有效问卷计酬，要求表达自然、有耐心。", "问卷调研", 62, PriceType.FIXED, "4 小时/天", "本周末", TaskStatus.OPEN, 4),
    ("图书馆晚班助理", "协助晚间借还书与上架整理，每周三次，环境安静可带复习资料。", "图书管理", 69, PriceType.FIXED, "3 小时/班", "长期", TaskStatus.OPEN, 7),
    ("实验室样本登记", "协助登记实验室样本编号并录入台账，约 200 份，要求认真负责。", "其他", 78, PriceType.FIXED, "弹性", "一周内", TaskStatus.PENDING, 0),
    ("校运动会志愿者招募", "协助运动会当天检录与秩序维护，提供志愿时长证明与午餐。", "其他", 0, PriceType.FIXED, "全天", "运动会当天", TaskStatus.PENDING, 1),
    ("二手教材回收整理", "回收并分类整理旧教材，按整理数量计酬，体力活但结算快。", "其他", 92, PriceType.NEGOTIABLE, "弹性", "三天内", TaskStatus.PENDING, 2),
    ("摄影工作室样片模特", "为校内摄影工作室拍摄样片一组，要求上镜自然，可谈按套结算。", "其他", 168, PriceType.NEGOTIABLE, "半天", "约定时间", TaskStatus.REJECTED, 6),
]


def seed(db: Session) -> None:
    default_users = [
        ("admin", "admin123", "admin", "管理员"),
        ("publisher", "123456", "publisher", "示例发布者"),
        ("receiver", "123456", "receiver", "示例接单者"),
    ]
    for username, raw_password, role, nickname in default_users:
        if db.scalar(select(User).where(User.username == username)) is None:
            db.add(User(
                username=username,
                password_hash=hash_password(raw_password),
                role=role,
                nickname=nickname,
            ))

    for name in CATEGORY_NAMES:
        if db.scalar(select(Category).where(Category.name == name)) is None:
            db.add(Category(name=name))
    db.flush()

    publisher = db.scalar(select(User).where(User.username == "publisher"))
    receiver = db.scalar(select(User).where(User.username == "receiver"))
    category_map = {c.name: c.id for c in db.scalars(select(Category)).all()}

    now = datetime.now()
    existing_titles = set(db.scalars(select(Task.title)).all())
    for title, description, category_name, reward, price_type, duration, deadline, status, days_ago in TASK_SAMPLES:
        if title in existing_titles:
            continue
        db.add(Task(
            title=title,
            description=description,
            category_id=category_map.get(category_name),
            reward=reward,
            reward_unit="元",
            price_type=price_type,
            duration=duration,
            deadline=deadline,
            status=status,
            publisher_id=publisher.id if publisher else 1,
            receiver_id=(receiver.id if receiver else None) if status in (TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED) else None,
            created_at=now - timedelta(days=days_ago),
        ))

    db.commit()


def main() -> None:
    reset = "--reset" in sys.argv
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    print("数据库初始化完成：backend/data.db")


if __name__ == "__main__":
    main()
