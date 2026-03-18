# Requirements Toggl Tracker to CSV

## Overview

This Python service connects to Toggl API to: 1) get project names and 2) collect time entries for the last 7 days for each project, 3) sum the time entries for each project, 4) print the results and write to a CSV file. All the code for this project is stored in the src/ folder.

## ENV

```
PATH_PROJECT_RESOURCES=/Users/nick/Documents/_project_resources/PersonalWeb03
TOGGL_EMAIL=nrodrig1@gmail.com
TOGGL_PASSWORD=SECRET
```

## Steps

### Step 1: Collect project names

Connect with the Toggl API to collect project names. Use the credentials stored in the .env file.TOGGL_EMAIL and TOGGL_PASSWORD.

### Step 2: Collect time entries

Connect with the Toggl API to collect time entries for the last 7 days for each project. Use the credentials stored in the .env file.TOGGL_EMAIL and TOGGL_PASSWORD.

### Step 3: Sum time entries by project

Sum the time entries for each project.

### Step 4: Print results

Print the results to the console.

### Step 5: Write to CSV

Write the results to a CSV file in the sub folder called services-data in the PATH_PROJECT_RESOURCES folder called project_time_entries.csv. This file will have three columns project_name, hours_worked and datetime_collected.
