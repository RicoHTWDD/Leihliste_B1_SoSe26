from rest_framework import serializers
from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "category", "location", "status"]



class LoanRequestSerializer(serializers.Serializer):
    item_id = serializers.IntegerField(min_value=1)
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    def validate(self, data):
        if data["end_date"] < data["start_date"]:
            raise serializers.ValidationError(
                {
                    "end_date": (
                        "Das Enddatum darf nicht vor dem "
                        "Startdatum liegen."
                    )
                }
            )

        return data