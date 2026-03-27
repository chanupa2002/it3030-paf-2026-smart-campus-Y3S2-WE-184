package com.uninode.smartcampus.modules.facilities.repository;

public interface FacilityCatalogProjection {
    Long getId();

    String getType();

    String getName();

    Integer getCapacity();

    String getLocation();

    Boolean getCurrentlyBooked();

    Long getUpcomingBookingCount();
}
