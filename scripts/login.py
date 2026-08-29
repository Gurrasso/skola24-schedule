from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)

    context = browser.new_context()
    page = context.new_page()

    page.goto("https://lund-sso.skola24.se/")

    page.get_by_role("textbox").fill(
        input("Enter Username or email: ")
    )
    page.get_by_role("button", name="next").click()

    page.get_by_role(
        "button",
        name="Sign in using your username and password"
    ).click()

    # Enter your password manually
    page.get_by_role("textbox").fill(input("Enter password: "))
    page.get_by_role("button", name="Sign in").click()

    page.wait_for_load_state("networkidle")

    # Save cookies/local storage/etc.
    context.storage_state(path="auth.json")

    print("Authentication state saved to auth.json")

    browser.close()
