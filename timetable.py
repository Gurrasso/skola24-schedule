import json
from playwright.sync_api import sync_playwright
from datetime import datetime
import re

def is_time(value):
    return bool(re.fullmatch(r"\d{1,2}:\d{2}", value))


def parse_lessons(data):
    # Find where the times start
    time_index = next(
        i for i, value in enumerate(data)
        if ":" in value
    )

    lesson_data = data[:time_index]
    times = data[time_index:]

    lessons = []

    # Every lesson is always:
    # name, teachers, rooms
    for i in range(0, len(lesson_data), 3):
        name = lesson_data[i]
        teachers = lesson_data[i + 1]
        rooms = lesson_data[i + 2]

        lessons.append({
            "name": name,
            "teachers": teachers.split(",") if teachers else [],
            "rooms": rooms.split(",") if rooms else [],
        })

    # Times always come in start/end pairs
    for lesson, (start, end) in zip(
        lessons,
        zip(times[::2], times[1::2])
    ):
        lesson["start"] = start
        lesson["end"] = end

    return {"lessons": lessons}


def extract_timetable(page):
    svg = page.locator("div.w-timetable svg")

    texts = svg.locator("text")

    # First relevant element
    FIRST_ELEMENT_POS = 19

    data = []

    # Loops over all the text and parser into a json of the day's schedule
    for i in range(FIRST_ELEMENT_POS, texts.count()):
        text = texts.nth(i)
        content = text.text_content()
        data.append(content)

    
    if len(data) > 0:
        return parse_lessons(data)
    else:
        return { "lessons" : [] }
        

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False
    )

    context = browser.new_context(
        storage_state="auth.json"
    )

    page = context.new_page()

    page.goto(
        "https://web.skola24.se/portal/start/timetable/timetable-viewer"
    )

    page.wait_for_load_state("networkidle")

    is_weekend = False

    day_map = {
        0: "Må",  # Monday
        1: "Ti",  # Tuesday
        2: "On",  # Wednesday
        3: "To",  # Thursday
        4: "Fr",  # Friday
    }

    #day_name = day_map.get(datetime.now().weekday())
    day_name = day_map.get(4)

    if not day_name:
        is_weekend = True
    else: 
        page.locator(
            "ul.w-button-group.w-button-group-fill-row button.w-button"
        ).filter(
            has_text=day_name
        ).click()

    page.wait_for_timeout(300)


    if not is_weekend:
        timetable = extract_timetable(page)
    else:
        timetable = { "lessons" : [] }

    print(json.dumps(
        timetable,
        indent=2,
        ensure_ascii=False
    ))

    with open(
        "../timetable.json",
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(
            timetable,
            f,
           indent=2,
           ensure_ascii=False
    )

    browser.close()
