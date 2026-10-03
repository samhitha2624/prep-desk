# Admin dashboard

Admins manage everything learners see, without touching code. Open it from **Dashboard** in the sidebar or **Admin dashboard** in the account menu. The address is `#/admin`.

## Who is an admin

- The first account ever created.
- Anyone listed in `ADMIN_EMAILS` in `api/.env`. These are always admins, even if someone clicks Remove admin.
- Anyone an admin promotes on the Users screen.

The API checks the role on every admin request, so hiding the dashboard is not the only protection. Learners who open `#/admin` are sent back to the home page.

## Screens

**Overview.** Totals for topics written, tricks, quiz questions and accounts, a table per subject with how much is written, and the next topics still to write.

**Topics.** Pick a subject, then:
- **Add topic** opens a blank form: title, one-line summary, subject, level and reading time, then repeatable groups for synopsis sections, key rules and tricks. Use **+ Add section / rule / trick** for more rows and **Remove** to drop one.
- **Edit** opens the same form filled in.
- **Delete** needs a second click to confirm. It removes the topic and its quiz.
- **Restore original** brings back the subject's topics and quizzes from the seed files in `api/data/seed`. It needs a second click to confirm.

A topic with no synopsis shows to learners as "Coming soon".

Synopsis text: blank lines start a new paragraph. `<b>`, `<i>`, `<ul>`, `<ol>`, `<li>` and `<code>` work for formatting; any other HTML is removed.

**Quizzes.** Pick a topic, then add questions. Each has the question, up to four options, the correct answer (the radio button) and an optional explanation shown after answering. Learners take the quiz on the topic's **Practice** tab.

**Users.** Every account with its role and join date. Also shows how many topics each person has read. Admins can give or remove admin access and delete accounts. You cannot delete your own account here, and there must always be at least one admin.

## Where changes are saved

Changes go to the API and are saved in `api/data/db.json`, so everyone sees them straight away. The seed files in `api/data/seed` are only the starting point; they are not changed by the dashboard. To make an edit part of the seed, copy it into the seed JSON.

A learner who forgets their password cannot reset it by email. Delete their account on the Users screen and ask them to sign up again.

In the demo build (`npm run build:demo`, used for the shareable preview) there is no API: accounts and changes are kept in that browser only.
