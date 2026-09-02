from playwright.sync_api import sync_playwright

def login_lund_sso(page):
    page.goto("https://lund-sso.skola24.se/")

    # Enter username or email manually
    page.get_by_role("textbox").fill(
        input("Enter Username or email: ")
    )
    page.get_by_role("button", name="next").click()

    page.get_by_role(
        "button",
        name="Sign in using your username and password"
    ).click()

    # Enter your password manually
    page.get_by_role("textbox").fill(
        input("Enter password: ")
    )
    page.get_by_role("button", name="Sign in").click()

def login_default(page, domain):
    page.goto("https://" + domain + ".skola24.se/")

    # Enter username manually
    page.get_by_role("textbox", name="Användarnamn").fill(
        input("Enter Username: ")
    )

    # Enter your password manually
    page.get_by_role("textbox", name="Lösenord").fill(
        input("Enter password: ")
    )

    page.get_by_role("button", name="Logga in").click()

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)

        context = browser.new_context()
        page = context.new_page()

        # TODO: Add check for invalid domains
        domain = input("Enter skola24 domain(municipality): ").lower()
        match domain:
            case "":
                print("Invalid domain")
                return
            case "lund" | "lund-sso":
                login_lund_sso(page)
            case _:
                login_default(page, domain)

        page.wait_for_load_state("networkidle")

        # Save cookies/local storage/etc.
        context.storage_state(path="auth.json")

        print("Authentication state saved to auth.json")

        browser.close()

main()
