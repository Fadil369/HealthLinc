import anthropic

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key="my_api_key",
)

# Replace placeholders like {{PROJECT_DESCRIPTION}} with real values,
# because the SDK does not support variables.
message = client.messages.create(
    model="claude-opus-4-20250514",
    max_tokens=20000,
    temperature=1,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "{{PROJECT_DESCRIPTION}}"
                }
            ]
        }
    ],
    thinking={
        "type": "enabled",
        "budget_tokens": 16000
    }
)
print(message.content)