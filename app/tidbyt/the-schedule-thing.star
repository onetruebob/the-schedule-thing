load("render.star", "render")
load("encoding/json.star", "json")



def main(config):
  if (config["data"]):
    next_event = json.decode(config["data"])
  else:
    return render.Root(
      delay = 500,
      child = render.Column(
        children = render.Text(
          content = "No upcomming events.",
        ),
        main_align = "space_around",
        expanded = True,
      ),
    )

  event_name = next_event["eventName"]
  english_days_until = next_event["englishDaysUntil"]

  return render.Root(
    delay = 500,
    child = render.Column(
      children = [
        render.WrappedText(
          content = event_name,
          height = 16,
          color = "#fff",
        ),
        render.Box(
          width = 64,
          height = 1,
          color = "#022169",
        ),
        render.Text(
          content = english_days_until,
          color = "#ff426c"
        ),
      ],
      main_align = "space_between",
      expanded = True
    )
  )