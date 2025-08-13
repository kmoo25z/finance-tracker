import requests
from decimal import Decimal
from django.core.cache import cache
from django.conf import settings

class ExchangeRateService:
    """Service for handling currency exchange rates"""
    
    # You can use a free API like exchangerate-api.com
    API_URL = "https://api.exchangerate-api.com/v4/latest/{}"
    CACHE_TIMEOUT = 3600  # 1 hour
    
    @classmethod
    def get_exchange_rate(cls, from_currency, to_currency):
        """Get exchange rate from one currency to another"""
        if from_currency == to_currency:
            return Decimal('1.0')
        
        # Check cache first
        cache_key = f"exchange_rate_{from_currency}_{to_currency}"
        cached_rate = cache.get(cache_key)
        if cached_rate:
            return Decimal(str(cached_rate))
        
        try:
            response = requests.get(cls.API_URL.format(from_currency))
            response.raise_for_status()
            data = response.json()
            
            rate = Decimal(str(data['rates'].get(to_currency, 1)))
            
            # Cache the rate
            cache.set(cache_key, float(rate), cls.CACHE_TIMEOUT)
            
            return rate
        except Exception as e:
            # Log error and return default rate
            print(f"Error fetching exchange rate: {e}")
            return Decimal('1.0')
    
    @classmethod
    def convert_amount(cls, amount, from_currency, to_currency):
        """Convert amount from one currency to another"""
        rate = cls.get_exchange_rate(from_currency, to_currency)
        return amount * rate