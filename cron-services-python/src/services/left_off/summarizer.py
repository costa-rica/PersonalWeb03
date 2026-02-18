"""
AI-powered summarizer for LEFT-OFF activities using OpenAI API.
"""

import json
from datetime import datetime
from pathlib import Path
from openai import OpenAI
from loguru import logger


class Summarizer:
    """Generates AI-powered summaries of LEFT-OFF activities using OpenAI."""

    def __init__(self, api_key, base_url=None, model='gpt-4o-mini'):
        """
        Initialize the summarizer.

        Args:
            api_key: OpenAI API key
            base_url: Optional custom base URL for OpenAI API
            model: Model to use (default: gpt-4o-mini)
        """
        self.api_key = api_key
        self.model = model
        
        # Initialize OpenAI client with simple initialization
        self.client = OpenAI(api_key=api_key)
        
        logger.info(f"Summarizer initialized with model: {model}")

    def generate_summary(self, activities_path, template_path):
        """
        Generate an AI-powered summary of the activities.

        Args:
            activities_path: Path to the last-7-days-activities.md file
            template_path: Path to the prompt template file

        Returns:
            dict: JSON response with summary and datetime, or None if error
        """
        logger.info("Generating AI summary")
        
        try:
            # Read the activities markdown
            logger.info(f"Reading activities from: {activities_path}")
            with open(activities_path, 'r', encoding='utf-8') as f:
                activities_content = f.read()
            
            logger.info(f"Activities content length: {len(activities_content)} characters")
            
            # Read the prompt template
            logger.info(f"Reading prompt template from: {template_path}")
            with open(template_path, 'r', encoding='utf-8') as f:
                prompt_template = f.read()
            
            # Replace placeholder with activities content
            prompt = prompt_template.replace('<< last-7-days-activities.md >>', activities_content)
            
            logger.info(f"Sending request to OpenAI API ({self.model})")
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            summary_json = response.choices[0].message.content
            logger.info("Received response from OpenAI API")
            
            # Parse and validate JSON
            result = json.loads(summary_json)
            
            # Add current datetime if not present
            if 'datetime_summary' not in result:
                result['datetime_summary'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            logger.info("Summary generated successfully")
            logger.info(f"Summary: {result.get('summary', '')[:100]}...")
            
            return result
            
        except FileNotFoundError as e:
            logger.error(f"File not found: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response content: {summary_json if 'summary_json' in locals() else 'N/A'}")
            return None
        except Exception as e:
            logger.error(f"Error generating summary: {e}", exc_info=True)
            return None
